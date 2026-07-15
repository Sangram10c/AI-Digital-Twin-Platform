import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    $transaction: jest.fn(),
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it('returns paginated users', async () => {
    prisma.$transaction.mockResolvedValue([
      2,
      [{ id: 'user-1', email: 'a@b.com' }],
    ]);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(2);
    expect(result.data).toHaveLength(1);
  });
});
