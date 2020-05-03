# Batches Directory
Put batch files here, and they must following syntax:

basic.yml
```yaml
name: "Basic commands"
description: "Represents some basic commands."
commands:
  remove:
    name: "remove file"
    description: "Removes test file."
    run:
      - "rm -rf test"
  create:
    name: "create specified file"
    description: "Creates specified file."
    run:
      - "touch $0"
```
