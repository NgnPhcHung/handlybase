
# Server side 
> [!INFO] You can see some default and sample api call at `postman/`

> [!IMPORTANT] the folder named `handly/` please do not edit it

## The first thing
Step 1
- Create dotenv file 
```bash
cp .env.example .env

```

- Fill all blank file in your `.env` file
- run bash

Run this to setup database predefined
```bash
pnpm handly migration:run
```

## Migration
**Create Migration** 

```bash
pnpm handly migration:create -c path_to_datasource_config "migration_message"

# ex 
pnpm handly migration:create -c src/datasource.ts "update post correct misspell subauthor"
```

**Revert migration** 
```bash
pnpm handly migration:revert
```


## Incase you delete file database.db before run app
run  to generate your admin default password to hash string
```bash
pnpm handly:hash hash your_default_admin_password

```


