import { Module } from '@nestjs/common';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
