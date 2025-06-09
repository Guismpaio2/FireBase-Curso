import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// CORREÇÃO: Ajuste o caminho de importação para o DatabaseService
import { DatabaseService } from '../../services/database.service'; // <<< CORREÇÃO AQUI
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrl: './add-movie.component.scss',
})
export class AddMovieComponent {
  movieForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress: number = 0;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.movieForm = this.fb.group({
      name: ['', [Validators.required]],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      analysis: ['', [Validators.required]],
      photo_url: [''],
    });
  }

  setRating(rating: number) {
    this.movieForm.patchValue({
      rating: rating,
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }

  async onSubmit() {
    if (this.movieForm.valid) {
      if (!this.selectedFile) {
        alert('Por favor, insira uma imagem para o filme.');
        return;
      }

      const filePath = `movie_images/${Date.now()}_${this.selectedFile.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.selectedFile);

      task.percentageChanges().subscribe((percentage) => {
        if (percentage !== undefined) {
          this.uploadProgress = percentage;
        }
      });

      try {
        await task
          .snapshotChanges()
          .pipe(
            finalize(async () => {
              const downloadURL = await fileRef.getDownloadURL().toPromise();
              this.movieForm.patchValue({ photo_url: downloadURL });

              const formData = this.movieForm.value;
              this.databaseService
                .addDocument('movies', formData)
                .then(() => {
                  alert('Filme adicionado com sucesso!');
                  console.log('Documento Adicionado!');
                  this.movieForm.reset();
                  this.previewUrl = null;
                  this.selectedFile = null;
                  this.uploadProgress = 0;
                  this.onClose();
                })
                .catch((error: any) => {
                  // <<< CORREÇÃO AQUI: tipando 'error' explicitamente
                  console.error('Erro ao adicionar filme no Firestore:', error);
                  alert('Erro ao adicionar filme: ' + error.message);
                });
            })
          )
          .toPromise();
      } catch (error: any) {
        // <<< CORREÇÃO AQUI: tipando 'error' explicitamente
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao fazer upload da imagem: ' + error.message);
      }
    } else {
      alert(
        'Por favor, preencha todos os campos obrigatórios e adicione uma imagem.'
      );
    }
  }

  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }
}
