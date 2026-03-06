declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (databaseArray?: Uint8Array | ArrayBuffer | string) => any;
  }

  function initSqlJs(config?: any): Promise<SqlJsStatic>;
  
  export const Database: new (databaseArray?: Uint8Array | ArrayBuffer | string) => any;
  export default initSqlJs;
}
