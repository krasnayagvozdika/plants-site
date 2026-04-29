<?php

require __DIR__ . '/../backend/bootstrap.php';

auth_require_login();

$catalog = catalog_repository_read($config);
$items = $catalog['items'];
$types = [
    'pot' => 'в горшке',
    'ground' => 'в грунте',
    'cut' => 'под срезку',
];

function admin_xls_text($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function admin_xls_cell($value, string $style = 'Cell'): string
{
    return '<Cell ss:StyleID="' . admin_xls_text($style) . '"><Data ss:Type="String">' . admin_xls_text($value) . '</Data></Cell>';
}

$rowCount = count($items) + 2;

header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
header('Content-Disposition: attachment; filename="catalog.xls"');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

echo '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
echo '<?mso-application progid="Excel.Sheet"?>' . PHP_EOL;
?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>Каталог растений</Title>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Font ss:FontName="Arial" ss:Size="8"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Arial" ss:Size="13" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Header">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="8" ss:Bold="1"/>
      <Interior ss:Color="#E8F1E6" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Cell">
      <Alignment ss:Vertical="Top" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="8"/>
    </Style>
    <Style ss:ID="Center">
      <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="8"/>
    </Style>
    <Style ss:ID="Right">
      <Alignment ss:Horizontal="Right" ss:Vertical="Top" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Size="8"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Каталог">
    <Table ss:ExpandedColumnCount="8" ss:ExpandedRowCount="<?= app_h((string) $rowCount) ?>" x:FullColumns="1" x:FullRows="1">
      <Column ss:Width="25"/>
      <Column ss:Width="105"/>
      <Column ss:Width="65"/>
      <Column ss:Width="50"/>
      <Column ss:Width="40"/>
      <Column ss:Width="45"/>
      <Column ss:Width="60"/>
      <Column ss:Width="165"/>
      <Row ss:Height="22">
        <Cell ss:MergeAcross="7" ss:StyleID="Title"><Data ss:Type="String">Каталог растений</Data></Cell>
      </Row>
      <Row ss:Height="28">
        <Cell ss:StyleID="Header"><Data ss:Type="String">№ п/п</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Название</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Категория</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Формат</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Размер</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Цена, Br</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Наличие</Data></Cell>
        <Cell ss:StyleID="Header"><Data ss:Type="String">Описание</Data></Cell>
      </Row>
      <?php foreach ($items as $index => $item): ?>
        <?php
          $available = catalog_repository_normalize_available($item['available'] ?? true);
          $typeLabel = $types[$item['type'] ?? ''] ?? '';
        ?>
        <Row>
          <?= admin_xls_cell((string) ($index + 1), 'Center') ?>
          <?= admin_xls_cell($item['name'] ?? '') ?>
          <?= admin_xls_cell($item['category'] ?? '') ?>
          <?= admin_xls_cell($typeLabel) ?>
          <?= admin_xls_cell($item['size'] ?? '') ?>
          <?= admin_xls_cell($item['price'] ?? '', 'Right') ?>
          <?= admin_xls_cell($available ? 'В наличии' : 'Нет в наличии', 'Center') ?>
          <?= admin_xls_cell($item['description'] ?? '') ?>
        </Row>
      <?php endforeach; ?>
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Layout x:Orientation="Portrait"/>
        <PageMargins x:Bottom="0.35" x:Left="0.25" x:Right="0.25" x:Top="0.35"/>
      </PageSetup>
      <Print>
        <ValidPrinterInfo/>
        <PaperSizeIndex>9</PaperSizeIndex>
      </Print>
      <Panes>
        <Pane>
          <Number>3</Number>
          <ActiveRow>2</ActiveRow>
        </Pane>
      </Panes>
    </WorksheetOptions>
  </Worksheet>
</Workbook>
