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

  activeDropdownMovieId: string | null = null;
  selectedMovieForEdit: MovieInterface | null = null; // <<< NOVO

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
    this.databaseService
      .getCollection('movies')
      .subscribe((movies: MovieInterface[]) => {
        this.movies = movies;
        this.filterMovies(); // Aplica o filtro de busca ao carregar/recarregar
        this.updateDisplayedMovies();
      });
  }

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
        this.closeDropdown();
        this.loadMovies(); // Recarrega os filmes após a exclusão
      })
      .catch((error) => {
        console.error('Erro ao excluir documento:', error);
        alert('Erro ao excluir filme: ' + error.message);
      });
  }

  // >>> MÉTODOS PARA O MODAL DE ADIÇÃO/EDIÇÃO <<<
  openAddMovieModal() {
    this.selectedMovieForEdit = null; // Garante que estamos em modo de adição
    this.showAddMovieModal = true;
    this.closeDropdown(); // Fecha o dropdown se estiver aberto
  }

  openEditMovieModal(movie: MovieInterface) {
    this.selectedMovieForEdit = { ...movie }; // Passa uma cópia do filme
    this.showAddMovieModal = true;
    this.closeDropdown(); // Fecha o dropdown
  }

  closeAddOrEditModal() {
    this.showAddMovieModal = false;
    this.selectedMovieForEdit = null; // Limpa o filme em edição ao fechar
  }

  onMovieAddedOrUpdated() {
    this.loadMovies(); // Recarrega os filmes após uma adição ou atualização
    // O modal já se fecha via `onClose()` no `add-movie.component.ts`
  }
  // <<< FIM DOS MÉTODOS PARA O MODAL DE ADIÇÃO/EDIÇÃO >>>

  toggleMovieDropdown(movieId: string, event: Event) {
    event.stopPropagation();
    this.activeDropdownMovieId =
      this.activeDropdownMovieId === movieId ? null : movieId;
  }

  closeDropdown() {
    this.activeDropdownMovieId = null;
  }

  stopEventPropagation(event: Event) {
    event.stopPropagation();
  }

  filterMovies(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query === '') {
      // Se a busca estiver vazia, usa todos os filmes
      this.displayedMovies = this.movies.slice(
        this.currentOffset,
        this.currentOffset + this.limit
      );
      return;
    }

    const filtered = this.movies.filter((movie) =>
      movie.name.toLowerCase().includes(query)
    );
    this.displayedMovies = filtered; // Mostra todos os resultados filtrados
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
