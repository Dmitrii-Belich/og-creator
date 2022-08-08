import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import OgImageModule from '../og-image/og-image.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    OgImageModule('products'),
    OgImageModule('blog')
  ]
})
export class AppModule {
}
