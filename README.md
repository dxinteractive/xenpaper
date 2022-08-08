# xenpaper

Repo for [xenpaper.com](https://xenpaper.com). The source code is some of the worst I've ever produced, please not look ok thank.

## Build instructions

Install npm and yarn first.

```bash
yarn lerna init
yarn install
yarn add lerna -D -W

# builds webapp in xenpaper-app/build
yarn lerna run build

# serve webapp
serve -s packages/xenpaper-app/build
```
