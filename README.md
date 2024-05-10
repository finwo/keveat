keveat
======

Distributed key-value engine

## Basic project idea

  Types:
    length-prefixed string:
      <length>
        1 bit     -> extended
        7/15 bits -> length
      <n-bytes>
        data

  Simple entry layout
    <version> - 1 byte
      1 bit  -> extended (tbd, not supported = error)
      7 bits -> version number
    <transaction>
      64-bit number, increases by 1 for every update
    <parent>
      64-bit offset, reference to previous transaction
    <timestamp>
      64-bit unix timestamp in milliseconds
    <record>
      <null> = EOL
      <length-prefix string>: key
      <64-bit data length indicator>
      n-bytes data

  Structure:
    command: chunk
      provides a basic non-redundant key-value store based on the above storage description
    command: cluster
      provides redundancy spread over multiple servers, using a local chunk service

  Chunk api:

    > GET /kv/:key
    < 200 OK
    < ETag: <transaction number>
    < Last-Modified: <stringified timestamp>
    < Content-Encoding: <something?>
    < ...data...

    > PUT /kv/:key
    > Content-Encoding: <something?>
    > ...data...
    < 204 No Content
    < ETag: <transaction number>

    > DELETE /kv/:key
    < 204 No Content
