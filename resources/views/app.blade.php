<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>PharmaSync - Pharmacy System</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Phosphor Icons -->
  <script src="https://unpkg.com/@phosphor-icons/web"></script>

  <!-- React & ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-is@18/umd/react-is.development.js"></script>

  <!-- Babel -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Recharts -->
  <script src="https://unpkg.com/prop-types@15.8.1/prop-types.js"></script>
  <script src="https://unpkg.com/recharts@2.1.12/umd/Recharts.js"></script>

  <!-- HTML5 QRCode Scanner -->
  <script src="https://unpkg.com/html5-qrcode"></script>

  <!-- Custom Styles -->
  <link rel="stylesheet" href="{{ asset('css/pharmasync.css') }}">
</head>
<body>
  <div id="root"></div>

  <!-- 1. Laravel API Shim (plain JS - replaces Supabase, runs first) -->
  <script src="{{ asset('js/pharmasync-api.js') }}"></script>

  <!-- 2-5. React App (split into parts to stay within file size limits) -->
  <script type="text/babel" src="{{ asset('js/pharmasync-p1.js') }}" data-presets="react"></script>
  <script type="text/babel" src="{{ asset('js/pharmasync-p2.js') }}" data-presets="react"></script>
  <script type="text/babel" src="{{ asset('js/pharmasync-p3.js') }}" data-presets="react"></script>
  <script type="text/babel" src="{{ asset('js/pharmasync-p4.js') }}" data-presets="react"></script>
</body>
</html>
