import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router'; // <-- Correct import
import { UserInterface } from '../interfaces/user-interface';
import { error, log } from 'console';
import { Observable, switchMap, of } from 'rxjs'; // <-- Add 'of'
import { off } from 'process';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  cadastro(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) {
    if (password != confirmPassword) {
      alert('As senhas não coicidem');
      return;
    }

    this.auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        const user = userCredential?.user;

        if (user) {
          const userData: UserInterface = {
            name: name,
            email: email,
            tipo: 'Usuário',
          };

          await this.SalvarDados(user.uid, userData);
          user.sendEmailVerification();
          this.auth.signOut();
        }
      })

      .catch((error) => {
        console.log(error);
      });
  }

  SalvarDados(id: string, user: UserInterface) {
    return this.firestore.collection('users').doc(id).set(user);
  }
  login(email: string, password: string) {
    this.auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        if (userCredential.user?.emailVerified) {
          console.log('Sucesso');

          this.router.navigate(['/home']);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  redefinirSenhar(email: string) {
    this.auth
      .sendPasswordResetEmail(email)
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });
  }
  logout() {
    this.auth
      .signOut()
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserData(): Observable<any> {
    return this.auth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore.collection('user').doc(user.uid).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }
}
