import { isPrivateIp, assertSafePublicHttpUrl } from './ssrf';

describe('SSRF guards', () => {
  it('allows public https urls', () => {
    expect(assertSafePublicHttpUrl('https://example.edu.eg/contact').hostname).toBe(
      'example.edu.eg',
    );
  });

  it('blocks localhost and metadata', () => {
    expect(() => assertSafePublicHttpUrl('http://localhost/admin')).toThrow(/Localhost/i);
    expect(() => assertSafePublicHttpUrl('http://169.254.169.254/latest')).toThrow(/Metadata/i);
  });

  it('blocks private IPs', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(() => assertSafePublicHttpUrl('http://127.0.0.1/')).toThrow(/Private/i);
  });

  it('blocks non-http schemes', () => {
    expect(() => assertSafePublicHttpUrl('file:///etc/passwd')).toThrow(/http/i);
  });
});
