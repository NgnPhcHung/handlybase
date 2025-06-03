# Migration
**Create Migration** 

```bash
pnpm handly migration:create -c path_to_datasource_config "migration_message"

# ex 
pnpm handly migration:create -c src/datasource.ts "update post correct misspell subauthor"
```

**Revert migration** 
