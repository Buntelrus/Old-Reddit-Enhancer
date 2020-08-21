export default function(config, changelog) {
  if (config.version !== VERSION) {
    console.log(`update to verion: ${VERSION}`)
    changelog.show()
    config.version = VERSION
    config.save()
  }
}