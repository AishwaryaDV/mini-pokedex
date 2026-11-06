import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { PokemonStats } from '../../models/pokemon.model';

/** Highest possible base stat, used as the radar axis maximum. */
const MAX_STAT = 255;

/**
 * Radar chart of a Pokémon's six base stats. Rebuilding {@link options} when the
 * input stats change lets ECharts animate the morph between Pokémon.
 */
@Component({
  selector: 'app-stat-radar-chart',
  imports: [NgxEchartsDirective],
  templateUrl: './stat-radar-chart.component.html',
  styleUrl: './stat-radar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRadarChartComponent {
  /** The six base stats to plot. */
  readonly stats = input.required<PokemonStats>();

  protected readonly options = computed<EChartsOption>(() => {
    const stats = this.stats();
    return {
      animationDuration: 500,
      tooltip: { trigger: 'item' },
      radar: {
        indicator: [
          { name: 'HP', max: MAX_STAT },
          { name: 'Attack', max: MAX_STAT },
          { name: 'Defense', max: MAX_STAT },
          { name: 'Sp. Atk', max: MAX_STAT },
          { name: 'Sp. Def', max: MAX_STAT },
          { name: 'Speed', max: MAX_STAT },
        ],
        axisName: { color: '#9aa0a0' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.12)' } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              name: 'Base stats',
              value: [
                stats.hp,
                stats.attack,
                stats.defense,
                stats.specialAttack,
                stats.specialDefense,
                stats.speed,
              ],
              areaStyle: { color: 'rgba(0, 122, 204, 0.3)' },
              lineStyle: { color: '#007acc' },
              itemStyle: { color: '#007acc' },
            },
          ],
        },
      ],
    };
  });
}
