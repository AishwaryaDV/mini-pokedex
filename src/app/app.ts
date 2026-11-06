import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './common/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './common/components/toast/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
