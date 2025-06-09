import { Component, OnInit } from '@angular/core';
import { MovieInterface } from '../../shared/interfaces/movie-interface';
import { DatabaseService } from '../../shared/services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  showAddMovieModal = false;
  searchQuery = '';
  displayedMovies: MovieInterface[] = [];
  movies: MovieInterface[] = [];
  limit = 4;
  currentOffset = 0;

  // Variável-chave para controlar o dropdown
  activeDropdownMovieId: string | null = null;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.databaseService
      .getCollection('movies')
      .subscribe((movies: MovieInterface[]) => {
        this.movies = movies;
        this.updateDisplayedMovies();
      });
  }

  // Atualiza a lista de filmes visíveis (usado na inicialização e paginação)
  updateDisplayedMovies() {
    this.displayedMovies = this.movies.slice(
      this.currentOffset,
      this.currentOffset + this.limit
    );
  }

  deleteMovie(id: string) {
    this.databaseService
      .deleteDocument('movies', id)
      .then(() => {
        console.log('Documento excluído com sucesso!');
        this.closeDropdown(); // Fecha o menu após a exclusão
      })
      .catch((error) => {
        // A mensagem de sucesso deve estar no .then()
        console.error('Erro ao excluir documento:', error);
      });
  }

  toggleAddMovieModal() {
    this.showAddMovieModal = !this.showAddMovieModal;
  }

  toggleMovieDropdown(movieId: string, event: Event) {
    event.stopPropagation(); // Impede que o clique feche o menu imediatamente
    this.activeDropdownMovieId =
      this.activeDropdownMovieId === movieId ? null : movieId;
  }

  // Fecha qualquer dropdown que estiver aberto
  closeDropdown() {
    this.activeDropdownMovieId = null;
  }

  // Impede que um clique DENTRO do menu o feche
  stopEventPropagation(event: Event) {
    event.stopPropagation();
  }

  filterMovies(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query === '') {
      this.updateDisplayedMovies();
      return;
    }

    const filtered = this.movies.filter((movie) =>
      movie.name.toLowerCase().includes(query)
    );
    // Para busca, mostramos todos os resultados, sem paginação
    this.displayedMovies = filtered;
  }

  showNext() {
    if (this.currentOffset + this.limit < this.movies.length) {
      this.currentOffset += this.limit;
      this.updateDisplayedMovies();
    }
  }

  showPrevious() {
    if (this.currentOffset > 0) {
      this.currentOffset -= this.limit;
      this.updateDisplayedMovies();
    }
  }
}
