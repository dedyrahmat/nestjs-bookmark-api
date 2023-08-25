import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
    constructor(private prisma: PrismaService) { }

    getBookmarks(userId: number) {
        return this.prisma.bookmark.findMany({
            where: {
                userId
            }
        })
    }

    async getBookmarkByID(userId: number, bookmarkId: number) {
        return this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId,
            }
        })
    }

    async createBookmark(userId: number, body: CreateBookmarkDto) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...body
            }
        })
        return bookmark
    }

    async editBookmarkByID(userId: number, bookmarkId: number, editBody: EditBookmarkDto) {
        // get the bookmark by id
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        })

        // check if the bookmark is belong to the current user
        if (!bookmark || bookmark.userId !== userId) throw new ForbiddenException("Access to this resources is denied")

        return this.prisma.bookmark.update({
            where: {
                id: bookmarkId
            },
            data: { ...editBody }
        })
    }

    async deleteBookmarkByID(userId: number, bookmarkId: number) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        })

        // check if the bookmark is belong to the current user
        if (!bookmark || bookmark.userId !== userId) throw new ForbiddenException("Access to this resources is denied")
        await this.prisma.bookmark.delete({
            where: {
                id: bookmarkId
            }
        })
    }
}
