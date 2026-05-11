export const PROGRAM_ID_STR = import.meta.env.VITE_PROGRAM_ID || "D2MrauesmqwRTT59otk75TUn3ZuZFGBb2EhhWM1qd5Hx";

const IDL_DATA = {
  "metadata": {
    "name": "fastpay",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "recordTip",
      "discriminator": [73, 227, 116, 140, 45, 68, 49, 143],
      "accounts": [
        {
          "name": "tipRecord",
          "writable": true,
          "pda": {
            "seeds": [
              { "kind": "const", "value": [116, 105, 112] },
              { "kind": "account", "path": "sender" },
              { "kind": "account", "path": "receiver" },
              { "kind": "arg", "path": "timestamp" }
            ]
          }
        },
        { "name": "sender", "writable": true, "signer": true },
        { "name": "receiver" },
        { "name": "systemProgram", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "amount", "type": "u64" },
        { "name": "message", "type": "string" },
        { "name": "timestamp", "type": "i64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "tipRecord",
      "discriminator": [43, 243, 62, 130, 183, 4, 81, 185]
    }
  ],
  "events": [
    {
      "name": "tipRecorded",
      "discriminator": [162, 160, 202, 2, 118, 221, 176, 231]
    }
  ],
  "errors": [
    { "code": 6000, "name": "messageTooLong", "msg": "Message exceeds 200 characters" },
    { "code": 6001, "name": "invalidAmount", "msg": "Amount must be greater than 0" }
  ],
  "types": [
    {
      "name": "tipRecord",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "sender", "type": "pubkey" },
          { "name": "receiver", "type": "pubkey" },
          { "name": "amount", "type": "u64" },
          { "name": "message", "type": "string" },
          { "name": "timestamp", "type": "i64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
} as const;

export const IDL: any = IDL_DATA;

export type Fastpay = typeof IDL_DATA;