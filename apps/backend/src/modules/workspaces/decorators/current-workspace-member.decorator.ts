import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WorkspaceMemberContext } from '../interfaces/workspace-member-context.interface';

export const CurrentWorkspaceMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceMemberContext => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ workspaceMember: WorkspaceMemberContext }>();
    return request.workspaceMember;
  },
);
