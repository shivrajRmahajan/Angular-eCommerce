export class Storage {
   setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

   getItem(key: string){
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

   removeItem(key: string): void {
    localStorage.removeItem(key);
  }

   clear(): void {
    localStorage.clear();
  }
}

