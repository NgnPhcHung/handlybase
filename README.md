

# Server side 
## The first thing
```bash
cp .env.example .env

```

## Migration
**Create Migration** 

```bash
pnpm handly migration:create -c path_to_datasource_config "migration_message"

# ex 
pnpm handly migration:create -c src/datasource.ts "update post correct misspell subauthor"
```

**Revert migration** 

## Incase you delete file database.db before run app
run 
```bash
pnpm handly:hash hash your_default_admin_password

```

