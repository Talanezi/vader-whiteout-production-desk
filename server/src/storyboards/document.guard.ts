import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { StoryboardsService } from './storyboards.service';
/** Runs before multipart buffering, including for registered but unapproved users. */
@Injectable()
export class StoryboardDocumentGuard implements CanActivate {
  constructor(private readonly boards: StoryboardsService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    await this.boards.authorize(request.params.id, request.user);
    return true;
  }
}
