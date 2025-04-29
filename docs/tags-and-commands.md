# Tags and Commands

Tags start with `[` and end with `]`. After the opening `[` the tag name ("command") is given, followed by a space and the arguments. There can be multiple tags in a line.

In contrast, a command line starts with a `@` and is followed by the command name and its arguments. There can only be one command per line.

We do not differ between tags and commands and just call them both "commands".

## Arguments

Arguments are key-value pairs separated by `=`. The value can be enclosed by double quotes. If there follows nothing after the key, the value is `true`.
