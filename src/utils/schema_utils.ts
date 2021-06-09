// import fs from 'fs-extra';

// export async function readSchema(projectDirectory: string): Promise<string> {
//   const schemaFilePath = path.join(projectDirectory, 'schema.graphql');
//   const schemaDirectoryPath = path.join(projectDirectory, 'schema');
//   const schemaFileExists = await fs.exists(schemaFilePath);
//   const schemaDirectoryExists = await fs.exists(schemaDirectoryPath);
//   let schema;
//   if (schemaFileExists) {
//     schema = (await fs.readFile(schemaFilePath)).toString();
//   } else {
//     throw new Error(`Could not find a schema at ${schemaFilePath}`);
//   }
//   return schema;
// }