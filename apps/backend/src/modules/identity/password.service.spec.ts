import { PasswordService } from './services/password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes and verifies passwords with argon2id', async () => {
    const hash = await service.hash('Str0ng!Pass');
    expect(hash).not.toBe('Str0ng!Pass');
    await expect(service.verify('Str0ng!Pass', hash)).resolves.toBe(true);
    await expect(service.verify('WrongPass!', hash)).resolves.toBe(false);
  });
});
