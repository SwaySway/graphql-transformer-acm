# GraphQL Transformer ACM

The following package is a acm used in conjunction with `@auth`
Takes in a set of rules and categorizes them by the following

```
object
└── identityProvider (cognito/oidc/iam/apikey)
    └── identityStrategy (owner/staticGroup/dynamicGroup/public/private)
         └── entity (owner name, and group name)
             └── allowedOperations (create/read/update/delete)
                  ├── claim (where to search in the identity token)
                  └── fields (list of fields that are only allowed of given operation)
```

## Example Schema

The following schema

```
type Book @model
  @auth(rules:[
  { allow: owner, ownerField: "author", operations: [create read] }
  { allow: groups, groups: ["Admins"] }
]){
    id: ID!
    title: String 
    author: String!
    authorsNotes: String @auth( rules: [
        { allow: owner, ownerField: "author", operations: [update] }
    ])
    publisher: String!
    createdAt: AWSDateTime
    updatedAt: AWSDateTime
}
```

When passed through the acm an object with respective rules are passed down into the operations. The acm split down will look like this in the update opertation

```

```