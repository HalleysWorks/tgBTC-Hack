# Videos

The video links aren't working because:

1. **Invalid YouTube thumbnail URLs** - The video IDs `0b1j2k3l4m5` appear to be placeholder/fake IDs
2. **Mixed linking approach** - YouTube thumbnail images linking to local MP4 files creates confusion
3. **Local file paths** - Links point to `./video/` directory which may not exist or be accessible

**Fixed version:**

## Demo Videos

### tgBTC Demo Video 1

[![Watch the video](https://img.youtube.com/vi/oxq2N6hQr-g/maxresdefault.jpg)](https://www.youtube.com/watch?v=oxq2N6hQr-g)

### tgBTC Demo Video 2

[![Watch the video](https://img.youtube.com/vi/tjBJaroB0Vo/maxresdefault.jpg)](https://www.youtube.com/watch?v=tjBJaroB0Vo)

# Custom Contracts

## Project structure

- `contracts` - source code of all the smart contracts of the project and their dependencies.
- `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
- `tests` - tests for the contracts.
- `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`

```

```
