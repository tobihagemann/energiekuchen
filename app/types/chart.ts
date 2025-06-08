import { ChartOptions } from 'chart.js';

export interface ChartConfiguration {
  type: 'pie';
  data: ChartData;
  options: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
  hoverBackgroundColor: string[];
  hoverBorderColor: string[];
}
