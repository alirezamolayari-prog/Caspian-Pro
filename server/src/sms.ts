/**
 * SMS sending. `console` prints to the server log (for testing before an SMS
 * panel exists). `kavenegar` uses the Kavenegar REST API. To add another panel
 * (e.g. Melipayamak), implement `SmsProvider` and add it to `createSms`.
 */
import type { Config } from './config.ts';

export interface SmsProvider {
  /** Sends a login code. */
  sendOtp(phone: string, code: string): Promise<void>;
  /** Sends a plain text message (emergency alerts to security). */
  send(phone: string, message: string): Promise<void>;
}

export const consoleSms: SmsProvider = {
  async sendOtp(phone, code) {
    console.log(`[sms] login code for ${phone}: ${code}`);
  },
  async send(phone, message) {
    console.log(`[sms] to ${phone}: ${message}`);
  },
};

export function kavenegarSms(apiKey: string, template: string, sender: string): SmsProvider {
  const base = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}`;
  const call = async (path: string, params: Record<string, string>) => {
    const res = await fetch(`${base}/${path}?${new URLSearchParams(params)}`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`kavenegar ${path} failed: ${res.status} ${await res.text()}`);
  };
  const plain = (receptor: string, message: string) =>
    call('sms/send.json', { receptor, message, ...(sender ? { sender } : {}) });
  return {
    sendOtp: (phone, code) =>
      template
        ? call('verify/lookup.json', { receptor: phone, token: code, template })
        : plain(phone, `کاسپین پرو\nکد ورود: ${code}`),
    send: plain,
  };
}

export function createSms(config: Config): SmsProvider {
  if (config.sms.provider === 'kavenegar') {
    if (!config.sms.kavenegarKey)
      throw new Error('KAVENEGAR_API_KEY is required for SMS_PROVIDER=kavenegar');
    return kavenegarSms(config.sms.kavenegarKey, config.sms.kavenegarTemplate, config.sms.sender);
  }
  return consoleSms;
}
