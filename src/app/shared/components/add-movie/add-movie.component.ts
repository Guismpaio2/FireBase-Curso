import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { DatabaseService } from '../../services/database.service';
import { MovieInterface } from '../../interfaces/movie-interface';

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrl: './add-movie.component.scss',
})
export class AddMovieComponent implements OnInit, OnChanges {
  @Input() movieToEdit: MovieInterface | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() movieAddedOrUpdated = new EventEmitter<void>();

  movieForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress: number = 0;
  isEditMode = false;
  currentPhotoUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['movieToEdit']) {
      const movie = changes['movieToEdit'].currentValue;
      this.isEditMode = !!movie;

      if (this.isEditMode) {
        this.initializeForm(movie);
      } else if (!changes['movieToEdit'].firstChange) {
        this.resetForm();
      }
    }
  }

  initializeForm(movie?: MovieInterface) {
    this.movieForm = this.fb.group({
      name: [movie ? movie.name : '', [Validators.required]],
      rating: [
        movie ? movie.rating : 0,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      analysis: [movie ? movie.analysis : '', [Validators.required]],
      photo_url: [movie ? movie.photo_url : ''],
    });

    if (movie && movie.photo_url) {
      this.previewUrl = movie.photo_url;
      this.currentPhotoUrl = movie.photo_url;
    } else {
      this.previewUrl = null;
      this.currentPhotoUrl = null;
    }
    this.selectedFile = null;
    this.uploadProgress = 0;
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
      this.previewUrl = this.isEditMode ? this.currentPhotoUrl : null;
    }
  }

  async onSubmit() {
    if (this.movieForm.invalid) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (this.isEditMode && !this.selectedFile && this.currentPhotoUrl) {
      const formData: MovieInterface = this.movieForm.value;
      const movieId = this.movieToEdit!.id!;
      this.updateMovie(movieId, formData);
      return;
    }

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

            const formData: MovieInterface = this.movieForm.value;

            if (this.isEditMode) {
              const movieId = this.movieToEdit!.id!;
              if (
                this.currentPhotoUrl &&
                this.currentPhotoUrl !== downloadURL
              ) {
                this.deleteOldPhoto(this.currentPhotoUrl);
              }
              this.updateMovie(movieId, formData);
            } else {
              this.addMovie(formData);
            }
          })
        )
        .toPromise();
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem: ' + error.message);
    }
  }

  private addMovie(movieData: MovieInterface) {
    this.databaseService
      .addDocument('movies', movieData)
      .then(() => {
        alert('Filme adicionado com sucesso!');
        console.log('Documento Adicionado!');
        this.movieAddedOrUpdated.emit();
        this.onClose();
      })
      .catch((error: any) => {
        console.error('Erro ao adicionar filme no Firestore:', error);
        alert('Erro ao adicionar filme: ' + error.message);
      });
  }

  private updateMovie(id: string, movieData: MovieInterface) {
    this.databaseService
      .updateDocument('movies', id, movieData)
      .then(() => {
        alert('Filme atualizado com sucesso!');
        console.log('Documento Atualizado!');
        this.movieAddedOrUpdated.emit();
        this.onClose();
      })
      .catch((error: any) => {
        console.error('Erro ao atualizar filme no Firestore:', error);
        alert('Erro ao atualizar filme: ' + error.message);
      });
  }

  private deleteOldPhoto(photoUrl: string) {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      const bucketAndPath = photoUrl.substring(
        photoUrl.indexOf(baseUrl) + baseUrl.length
      );
      const filePathEncoded = bucketAndPath.substring(
        bucketAndPath.indexOf('/') + 1,
        bucketAndPath.indexOf('?')
      );
      const filePath = decodeURIComponent(filePathEncoded);

      const storageRef = this.storage.ref(filePath);
      storageRef.delete().subscribe(
        () => console.log('Foto antiga deletada do Storage.'),
        (error) =>
          console.warn('Erro ao deletar foto antiga do Storage:', error)
      );
    } catch (e) {
      console.error(
        'Erro ao tentar deletar foto antiga, URL inválida ou problema ao extrair path:',
        e
      );
    }
  }

  resetForm() {
    this.movieForm.reset({
      name: '',
      rating: 0,
      analysis: '',
      photo_url: '',
    });
    this.previewUrl = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.isEditMode = false;
    this.currentPhotoUrl = null;
  }

  onClose() {
    this.closeModal.emit();
    this.resetForm();
  }
}
