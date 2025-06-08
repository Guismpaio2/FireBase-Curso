import { DebugEventListener, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { cp } from 'fs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private db: AngularFirestore) {}

  addDocument(collection: string, data: any): Promise<any> {
    return this.db.collection(collection).add(data);
  }

  getDocument(collection: string, id: string): Observable<any | undefined> {
    return this.db.collection(collection).doc(id).valueChanges();
  }

  getCollection(collection: string): Observable<any[]> {
    return this.db.collection(collection).valueChanges({ idField: 'id' });
  }
  getCollectionWithFilter(
    collection: string,
    field: string,
    value: string
  ): Observable<any[]> {
    return this.db
      .collection(collection, (ref) => ref.where(field, '==', value))
      .valueChanges({ idField: 'id' });
  }

  // updateDocument(collection: string) {}

  deleteDocument(collection: string, id: string): Promise<void> {
    return this.db.collection(collection).doc(id).delete();
  }
}
