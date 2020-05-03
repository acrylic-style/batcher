# Batches Directory
Put batch files here, and they must following syntax:

basic.yml
```yaml
name: "Basic commands"
description: "Represents some basic commands."
tasks:
  remove:
    name: "remove file"
    description: "Removes test file."
    usage: "remove"
    run:
      - "rm -rf test"
  create:
    name: "create specified file"
    description: "Creates specified file."
    usage: "create <file>"
    cwd: "/home/user"
    run:
      - "touch $0"
```
