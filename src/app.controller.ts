import { Body, Controller, Get, Post, Render, Redirect, Res, Session } from '@nestjs/common';
import { AppService } from './app.service';
import { newMusicDTO } from './newMusicDTO';
import { Response } from 'express';
import MusicStreaming from './musicstreaming';
import UserDataDto from './userdata.dto';
import db from './db';
import * as bcrypt from 'bcrypt';
import musicstreaming from './musicstreaming';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  async index2(@Session() session: Record<string, any>) {
    const [ adatok ] = await musicstreaming.execute('SELECT id, title, artist, length FROM zeneszamok ORDER BY artist, title');
    console.log(adatok);

    let ujZeneGomb = false;
    let userName = '';
    if (session.user_id) {
      const [rows]: any = await db.execute(
        'SELECT username FROM users WHERE id = ?',
        [session.user_id],
      );
      userName = rows[0].username;
      ujZeneGomb = true;
    } else {
      userName = 'Guest';
    }

    return {
       musics: adatok, 
       message: 'Welcome to the homepage, ' + userName,
       ujZeneGomb: ujZeneGomb
      };
  }

  @Get('/newMusic')
  @Render('newMusic')
  async newMusic(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.user_id) {
      res.redirect('/');
    }
    return { };
  }

  @Post('/newMusic')
  @Render('newMusic')
  async addNewMusic(@Body() newMusic: newMusicDTO, @Res() res: Response) {
      const title = newMusic.title;
      const artist = newMusic.artist;
      const length = newMusic.length;
      if(title == "" || artist == "" || length.toString() == "") {
        return { messages: "Minden mezőt kötelező kitölteni!"};
      } else if (length < 0){
        return { messages: "Az életkor nem lehet negatív!"};
      } else {
        const [ adatok ] = await musicstreaming.execute('INSERT INTO zeneszamok (title, artist, length) VALUES (?, ?, ?)', [ 
          title,
          artist,
          length,
        ],
        );
        res.redirect('/');
      }
    }

  @Get('/register')
  @Render('register')
  registerForm() {
    return {};
  }

  @Post('/register')
  @Redirect()
  async register(@Body() userdata: UserDataDto) {
    await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [
      userdata.username,
      await bcrypt.hash(userdata.password, 10),
    ]);
    return {
      url: '/',
    };
  }

  @Get('/login')
  @Render('login')
  loginForm() {
    return {};
  }

  @Post('/login')
  @Redirect()
  async login(
    @Body() userdata: UserDataDto,
    @Session() session: Record<string, any>,
  ) {
    const [rows]: any = await db.execute(
      'SELECT id, username, password FROM users WHERE username = ?',
      [userdata.username],
    );
    if (rows.length == 0) {
      return { url: '/login' };
    }
    if (await bcrypt.compare(userdata.password, rows[0].password)) {
      session.user_id = rows[0].id;

      return { url: '/' };
    } else {
      return { url: '/login' };
    }
  }

  @Get('/logout')
  @Redirect()
  logout(@Session() session: Record<string, any>) {
    session.user_id = null;
    return { url: '/' };
  }
}
