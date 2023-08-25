import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe("App E2E", () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )
    await app.init()
    await app.listen(3333)

    // clean the db with prisma
    prisma = app.get(PrismaService)
    await prisma.cleanDB()
    pactum.request.setBaseUrl("http://localhost:3333")
  })

  afterAll(() => {
    app.close()
  })

  describe('Auth', () => {
    const body: AuthDto = {
      email: "email@email.com",
      password: "password",
    }

    describe('Sign Up', () => {

      it("should throw if email is empty", () => {
        return pactum.spec().post("/auth/sign-up").withBody({
          password: body.password,
        }).expectStatus(HttpStatus.BAD_REQUEST) //400
      })

      it("should throw if password is empty", () => {
        return pactum.spec().post("/auth/sign-up").withBody({
          email: body.email,
        }).expectStatus(HttpStatus.BAD_REQUEST) //400
      })


      it("should throw if body is empty", () => {
        return pactum.spec().post("/auth/sign-up").expectStatus(HttpStatus.BAD_REQUEST) //400
      })

      it("should sign up", () => {
        return pactum.spec().post("/auth/sign-up").withBody(body).expectStatus(HttpStatus.CREATED) //201
      })
    })

    describe('Sign In', () => {
      it("should throw if email is empty", () => {
        return pactum.spec().post("/auth/sign-in").withBody({
          password: body.password,
        }).expectStatus(HttpStatus.BAD_REQUEST) //400
      })

      it("should throw if password is empty", () => {
        return pactum.spec().post("/auth/sign-in").withBody({
          email: body.email,
        }).expectStatus(HttpStatus.BAD_REQUEST) //400
      })


      it("should throw if body is empty", () => {
        return pactum.spec().post("/auth/sign-in").expectStatus(HttpStatus.BAD_REQUEST) //400
      })

      it("should sign in", () => {
        return pactum.spec().post("/auth/sign-in").withBody(body).expectStatus(HttpStatus.OK).stores("userAccessToken", "access_token") //200
      })
    })
  })

  describe('User', () => {
    describe('Get me', () => {
      it("should get current user", () => {
        return pactum.spec().get("/users/me").withHeaders({
          Authorization: "Bearer $S{userAccessToken}"
        }).expectStatus(HttpStatus.OK)
      })
    })
    describe('Edit Current user', () => {
      it("should edit current user", () => {
        const body: EditUserDto = {
          firstName: "Test",
          lastName: "User"
        }
        return pactum.spec().patch("/users").withHeaders({
          Authorization: "Bearer $S{userAccessToken}"
        }).withBody(body)
          .expectStatus(200)
          .expectBodyContains(body.firstName)
          .expectBodyContains(body.lastName)
      })
    })
  })

  describe('Bookmarks', () => {
    describe('Get Empty Bookmarks', () => {
      it("should return empty array of empty bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .expectStatus(HttpStatus.OK)
          .expectBody([])
      })
    })
    describe('Create Bookmark', () => {
      const payloadBody: CreateBookmarkDto = {
        title: "Bookmark title 1",
        description: "Here is bookmark description 1",
        link: "https://docs.nestjs.com/custom-decorators"
      }
      it("should create bookmark", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .withBody(payloadBody)
          .expectStatus(HttpStatus.CREATED)
          .stores("bookmarkId", "id")
      })

      it("should get all bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1)
      })
    })

    describe('Get Bookmark By ID', () => {
      it("should get bookmark by ID", () => {
        return pactum
          .spec()
          .get("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains("$S{bookmarkId}")
      })
    })

    describe('Edit Bookmark By ID', () => {
      const editPayloadBody: EditBookmarkDto = {
        title: "Bookmark title 1 is edited",
      }
      it("should edit bookmark", () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .withBody(editPayloadBody)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editPayloadBody.title)
      })
    })

    describe('Delete Bookmark By ID', () => {
      it("should delete bookmark", () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .expectStatus(HttpStatus.NO_CONTENT)
      })

      it("should return empty array of empty bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withHeaders({
            Authorization: "Bearer $S{userAccessToken}"
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0)
      })
    })
  })
})