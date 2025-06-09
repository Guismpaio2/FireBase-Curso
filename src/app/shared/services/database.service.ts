import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  DocumentReference,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { MovieInterface } from '../interfaces/movie-interface'; // Importe a interface

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private db: AngularFirestore) {} // Use 'db' aqui

  addDocument(collection: string, data: any): Promise<DocumentReference<any>> {
    return this.db.collection(collection).add(data);
  }

  getDocument(collection: string, id: string): Observable<any | undefined> {
    return this.db.collection(collection).doc(id).valueChanges();
  }

  getCollection(collection: string): Observable<MovieInterface[]> {
    return this.db
      .collection<MovieInterface>(collection)
      .valueChanges({ idField: 'id' });
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

  updateDocument(
    collectionName: string,
    id: string,
    data: Partial<MovieInterface>
  ): Promise<void> {
    return this.db.collection(collectionName).doc(id).update(data);
  }

  deleteDocument(collection: string, id: string): Promise<void> {
    return this.db.collection(collection).doc(id).delete();
  }
}
