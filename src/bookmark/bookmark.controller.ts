import { Controller, UseGuards, Get, Delete, Patch, Post, Param, ParseIntPipe, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { BookmarkService } from './bookmark.service';
import { GetUser } from '../auth/decorator';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
    constructor(private bookmarkService: BookmarkService) { }
    @Get()
    getBookmarks(@GetUser("id") userId: number) {
        return this.bookmarkService.getBookmarks(userId)
    }

    @Post()
    createBookmark(@GetUser("id") userId: number, @Body() body: CreateBookmarkDto) {
        return this.bookmarkService.createBookmark(userId, body)
    }

    @Get(":id")
    getBookmarkByID(@GetUser("id") userId: number, @Param("id", ParseIntPipe) bookmarkId: number) {
        return this.bookmarkService.getBookmarkByID(userId, bookmarkId)
    }

    @Patch(":id")
    editBookmarkByID(@GetUser("id") userId: number, @Param("id", ParseIntPipe) bookmarkId: number, @Body() editBody: EditBookmarkDto) {
        return this.bookmarkService.editBookmarkByID(userId, bookmarkId, editBody)
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(":id")
    deleteBookmarkByID(@GetUser("id") userId: number, @Param("id", ParseIntPipe) bookmarkId: number) {
        return this.bookmarkService.deleteBookmarkByID(userId, bookmarkId)
    }
}
