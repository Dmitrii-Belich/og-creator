import { Controller, Get, HttpException, HttpStatus, Query, Res, StreamableFile } from '@nestjs/common'
import nodeHtmlToImage from 'node-html-to-image'
const font2base64 = require('node-font2base64')


import * as fs from 'fs'
import * as path from 'path'

const sanitizeHtml = require('sanitize-html')
const axios = require('axios')
const crypto = require('node:crypto');

function hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

export default function(type: string): any {
  const image = fs.readFileSync(path.resolve(__dirname, `../../image-templates/${type}/background.png`))
  const base64Image = Buffer.from(image).toString('base64')
  const dataURI = 'data:image/jpeg;base64,' + base64Image

  @Controller(type)
  class OgImageController {
    @Get()
    async getImage(@Res({ passthrough: true }) res, @Query('data') data) {
      const dataClear = sanitizeHtml(data)

      if (!data) {
        return new HttpException('Require title query param', HttpStatus.BAD_REQUEST)
      } else {
        let title: string, version: string
        try {
          ({title, version} = JSON.parse(data))
        } catch (e) {
          return new HttpException(e.message, HttpStatus.BAD_REQUEST)
        }
        if (version === hash(title + 'secret_key')) {
          return await this.getResult(res, title.slice(0, 100))
        } else {
          return new HttpException('You do not have access to this resource', HttpStatus.FORBIDDEN)
        }
      }
    }

    private token = ''
    private expireDate: Date = new Date()

    async getResult(res, title) {
      if (new Date().getTime() >= this.expireDate.getTime()) {
        await this.getToken()
      }

      const files = await axios({
        method: 'get',
        url: process.env.STORAGE,
        headers: {
          'X-Auth-Token': this.token
        }
      })
        .then((res) => res.data)
        .catch(err => console.log(err))

      const filename = `${type}/` + OgImageController.getHash(title) + '.jpeg'
      const currentFile = files?.find(file => file.name === filename)
      if (currentFile) {
          res.status(HttpStatus.FOUND).redirect(`${process.env.STORAGE}${filename}`)
      } else {
        console.log('start')
        const image = await nodeHtmlToImage({
          html: fs.readFileSync(path.resolve(__dirname, `../../image-templates/${type}/index.html`)).toString(),
          puppeteerArgs: {
            defaultViewport: {
              width: 1200,
              height: 630
            }
          },
          waitUntil: 'domcontentloaded',
          type: 'jpeg',
          content: {
            title,
            font: await font2base64.encodeToDataUrl(path.resolve(__dirname, `../../image-templates/fonts/Manrope.woff2`)),
            style: fs.readFileSync(path.resolve(__dirname, `../../image-templates/${type}/index.css`)).toString(),
            imageSource: dataURI
          }
        })

        axios({
          method: 'put',
          url: `${process.env.STORAGE}${filename}`,
          headers: {
            'X-Auth-Token': this.token,
            'Content-Type': 'image/jpeg'
          },
          data: image
        }).catch(err => console.log(err))

        res.set('Content-type', 'image/jpeg')
        // @ts-ignore
        return new StreamableFile(image)
      }
    }

    private getToken() {
      return axios({
        method: 'get',
        url: 'https://api.selcdn.ru/auth/v1.0',
        headers: {
          'X-Auth-User': process.env.X_AUTH_USER,
          'X-Auth-Key': process.env.X_AUTH_KEY
        }
      })
        .then((response) => {
          this.token = response.headers['x-auth-token']
          this.expireDate = new Date(new Date().getTime() + Number(response.headers['X-Expire-Auth-Token'.toLowerCase()]) * 1000)
        })
        .catch(err => console.log(err))
        }

    private static getHash(title: string): string {
      return title.toLowerCase().split('')
        .filter(item => item !== ' ')
        .map(item => item.charCodeAt(0) || item).join('')
    }
  }

  return OgImageController
}

