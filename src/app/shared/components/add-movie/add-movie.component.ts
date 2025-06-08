import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-add-movie',
  templateUrl: './add-movie.component.html',
  styleUrl: './add-movie.component.scss',
})
export class AddMovieComponent {
  movieForm!: FormGroup;
  selectedFile: File | null = null; // foto do filme
  previewUrl: string | null = null; // pré visualização da imagem do filme

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.movieForm = this.fb.group({
      name: ['', [Validators.required]],
      rating: [0, [Validators.required]],
      analysis: ['', [Validators.required]],
      photo_path: [''],
    });
  }

  setRating(rating: number) {
    // Atualiza o valor de 'rating' no formulário
    this.movieForm.patchValue({
      rating: rating,
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (this.movieForm.valid) {
      const formData = this.movieForm.value;

      this.databaseService
        .addDocument('movies', formData)
        .then(() => {
          console.log('Documento Adicionado!');
          this.movieForm.reset();
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  // variável que emite um evento para o componente da home
  @Output() closeModal = new EventEmitter<void>();

  // Função que emite o evento para o componente da home, fechando o Modal
  onClose() {
    this.closeModal.emit();
  }
}
