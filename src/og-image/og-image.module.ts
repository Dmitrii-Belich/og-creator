import { Module } from '@nestjs/common'
import OgImageController from './og-image.controller'

export default function(type: string): any {
  @Module({
    controllers: [OgImageController(type)]
  })
  class OgImageModule {
  }

  return OgImageModule
}
