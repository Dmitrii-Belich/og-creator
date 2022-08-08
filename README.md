# Микросервис для генерации изображений для Open Graph разметки 

### Разработка

```sh
npm install
```

```sh
npm run start:dev
```

### Сборка

```sh
npm install
```

```sh
npm run start:prod
```

### Масштабирование

Новые роуты создаются путем добавления в app.module импорта с необходимым путем

```js
OgImageModule('products')
```

С заданным путем необходимо создать папку в image-templates по подобию существующих
