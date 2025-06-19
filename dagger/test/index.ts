import { connect } from '../dagger.ts'

await connect(async client => {
  await client.container().from('alpine:latest').withExec(['echo', 'Hello, World!']).sync()
})
