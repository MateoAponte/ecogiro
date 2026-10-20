import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh', () => {
  const jwt = { refreshTokens: jest.fn(), signTokens: jest.fn() };
  const users = { findUserById: jest.fn() };
  const service = new AuthService(jwt as never, users as never, {} as never);
  beforeEach(() => jest.resetAllMocks());

  it('loads the current user and issues tokens with current data', async () => {
    jwt.refreshTokens.mockReturnValue({ id: 5, name: 'Old name' });
    const user = { id: 5, name: 'Current name', eco_points: 250, rol: 1 };
    users.findUserById.mockResolvedValue(user);
    jwt.signTokens.mockReturnValue({ at_secret: 'access', rt_secret: 'refresh' });
    expect(await service.refresh('valid-refresh')).toEqual({ at_secret: 'access', rt_secret: 'refresh', user });
    expect(users.findUserById).toHaveBeenCalledWith('5');
    expect(jwt.signTokens).toHaveBeenCalledWith(user);
  });

  it('rejects a token whose user has been deleted', async () => {
    jwt.refreshTokens.mockReturnValue({ id: 5 });
    users.findUserById.mockResolvedValue(null);
    await expect(service.refresh('valid-refresh')).rejects.toThrow(UnauthorizedException);
    expect(jwt.signTokens).not.toHaveBeenCalled();
  });
});
