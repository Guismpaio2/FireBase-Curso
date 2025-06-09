import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { UserInterface } from '../interfaces/user-interface';
import { Observable, switchMap, of } from 'rxjs';
import firebase from 'firebase/compat/app';

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
      alert('As senhas não coincidem');
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
          alert(
            'Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta.'
          );
          this.router.navigate(['/']);
        }
      })
      .catch((error) => {
        console.log(error);
        alert('Erro ao cadastrar: ' + error.message);
      });
  }

  SalvarDados(id: string, user: UserInterface) {
    return this.firestore.collection('users').doc(id).set(user);
  }

  login(email: string, password: string, rememberMe: boolean = false) {
    const persistence = rememberMe
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    this.auth
      .setPersistence(persistence)
      .then(() => {
        return this.auth.signInWithEmailAndPassword(email, password);
      })
      .then((userCredential) => {
        if (userCredential.user?.emailVerified) {
          console.log('Login com E-mail/Senha Sucesso!');
          this.router.navigate(['/home']);
        } else {
          alert(
            'Verifique seu e-mail para ativar a conta antes de fazer login.'
          );
          this.auth.signOut();
        }
      })
      .catch((error) => {
        console.log(error);
        alert('Erro ao fazer login: ' + error.message);
      });
  }

  async googleSignIn() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const userCredential = await this.auth.signInWithPopup(provider);

      const user = userCredential.user;

      if (user) {
        const userDoc = await this.firestore
          .collection('users')
          .doc(user.uid)
          .get()
          .toPromise();

        if (!userDoc?.exists) {
          const userData: UserInterface = {
            name: user.displayName || 'Usuário Google',
            email: user.email || '',
            tipo: 'Usuário',
          };
          await this.SalvarDados(user.uid, userData);
        }
        console.log('Login com Google Sucesso!');
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      console.log('Erro ao fazer login com Google:', error);
      alert('Erro ao fazer login com Google: ' + error.message);
    }
  }

  redefinirSenhar(email: string) {
    this.auth
      .sendPasswordResetEmail(email)
      .then(() => {
        alert('E-mail de redefinição de senha enviado!');
      })
      .catch((error) => {
        console.log(error);
        alert('Erro ao redefinir senha: ' + error.message);
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
        alert('Erro ao fazer logout: ' + error.message);
      });
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth.authState.pipe(switchMap((user) => of(!!user)));
  }

  getUserData(): Observable<any> {
    return this.auth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .collection('users')
            .doc(user.uid)
            .valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }
}
