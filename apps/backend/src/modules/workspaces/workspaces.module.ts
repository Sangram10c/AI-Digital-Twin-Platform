import { Module, forwardRef } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [forwardRef(() => GithubModule)],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
