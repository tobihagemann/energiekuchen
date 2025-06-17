export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

interface Dataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
  hoverBackgroundColor: string[];
  hoverBorderColor?: string[];
}
