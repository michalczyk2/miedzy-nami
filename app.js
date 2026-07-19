'use strict';

const $=selector=>document.querySelector(selector);
const app=$('#app');
const modalRoot=$('#modal-root');
const toastEl=$('#toast');
const confettiEl=$('#confetti');
const STORAGE={settings:'mn-v02-settings',profile:'mn-v02-profile',session:'mn-v02-session'};
const CATEGORIES=['zabawne','codzienność','podróże','jedzenie','wspomnienia','przyszłość','relacja','romantyczne','głębsze','absurdalne'];
const CATEGORY_LABELS={zabawne:'Zabawne','codzienność':'Codzienność','podróże':'Podróże','jedzenie':'Jedzenie','wspomnienia':'Wspomnienia','przyszłość':'Przyszłość','relacja':'Relacja','romantyczne':'Romantyczne','głębsze':'Głębsze','absurdalne':'Absurdalne'};
const MODES={
 wave:{id:'wave',icon:'≈',title:'Na jednej fali',tagline:'Czy tak samo oceniacie świat?',description:'Jedna osoba poznaje tajną wartość od 1 do 10 i podaje przykład. Partner zgaduje, gdzie ten przykład leży na skali.',duration:'10–25 min',difficulty:'Lekka',instructions:['Pierwsza osoba widzi tajną liczbę i wpisuje przykład pasujący do skali.','Telefon przejmuje druga osoba, która zgaduje wartość od 1 do 10.','Po odsłonięciu porównujecie tok myślenia i zamieniacie role.'],scoring:'Zgadujący: 3 pkt za trafienie, 2 pkt za różnicę 1, 1 pkt za różnicę 2. Idealne trafienie daje też punkt wspólny.'},
 know:{id:'know',icon:'?',title:'Jak dobrze mnie znasz?',tagline:'Przewidujecie swoje wybory.',description:'Jedna osoba wskazuje prawdziwą odpowiedź, a partner próbuje ją przewidzieć. Role zmieniają się co rundę.',duration:'10–30 min',difficulty:'Średnia',instructions:['Osoba odpowiadająca wybiera prawdziwą opcję.','Po przekazaniu telefonu partner przewiduje jej odpowiedź.','Po odsłonięciu osoba odpowiadająca wyjaśnia swój wybór.'],scoring:'Zgadujący dostaje 2 pkt za trafienie, a para 1 punkt wspólny.'},
 who:{id:'who',icon:'↔',title:'Kto bardziej?',tagline:'Ja, ty czy zdecydowanie oboje?',description:'Oboje osobno wskazujecie, kogo bardziej opisuje zdanie. Odpowiedzi odkrywacie jednocześnie.',duration:'8–20 min',difficulty:'Lekka',instructions:['Pierwsza osoba wybiera: osoba 1, osoba 2 albo oboje.','Telefon przejmuje partner, który odpowiada bez podglądania.','Porównujecie odpowiedzi i podajecie po jednym przykładzie.'],scoring:'Zgodna odpowiedź daje każdej osobie 1 pkt i 1 punkt wspólny.'},
 dilemma:{id:'dilemma',icon:'◇',title:'Co wybierasz?',tagline:'Dwie osoby, jeden trudny wybór.',description:'Dylematy zabawne, codzienne i poważniejsze. Najciekawsze jest uzasadnienie, nie sama zgodność.',duration:'10–25 min',difficulty:'Średnia',instructions:['Pierwsza osoba wybiera jedną z dwóch możliwości.','Druga osoba odpowiada po przekazaniu telefonu.','Odkrywacie odpowiedzi i wyjaśniacie, dlaczego tak wybraliście.'],scoring:'Zgodny wybór daje każdej osobie 1 pkt i 1 punkt wspólny.'},
 scale:{id:'scale',icon:'10',title:'Od jednego do dziesięciu',tagline:'Jak mocna jest ta odpowiedź?',description:'Jedna osoba dostaje pytanie i tajną liczbę. Musi odpowiedzieć z dokładnie taką intensywnością, aby partner odgadł poziom.',duration:'10–25 min',difficulty:'Średnia',instructions:['Pierwsza osoba widzi tajną liczbę i wpisuje odpowiedź o odpowiedniej intensywności.','Partner zgaduje liczbę po przekazaniu telefonu.','Porównujecie, jak inaczej rozumiecie skalę.'],scoring:'Zgadujący: 3, 2 lub 1 pkt zależnie od odległości. Idealne trafienie daje punkt wspólny.'},
 plan:{id:'plan',icon:'!',title:'Idealny plan, fatalny szczegół',tagline:'Brzmi świetnie… prawie.',description:'Każda karta daje kuszącą propozycję i jeden problem. Oboje decydujecie, czy nadal bierzecie ofertę.',duration:'8–20 min',difficulty:'Lekka',instructions:['Pierwsza osoba poznaje cały scenariusz i decyduje.','Partner podejmuje własną decyzję po przekazaniu telefonu.','Odkrywacie odpowiedzi i ustalacie, gdzie przebiega wasza granica.'],scoring:'Zgodny wybór daje każdej osobie 1 pkt i 1 punkt wspólny.'},
 words:{id:'words',icon:'#',title:'Między słowami',tagline:'Jedna podpowiedź, trzy ukryte hasła.',description:'Wybierz trzy słowa z planszy i podaj jednowyrazową podpowiedź. Partner próbuje odtworzyć zestaw.',duration:'10–25 min',difficulty:'Średnia',instructions:['Pierwsza osoba zaznacza trzy tajne słowa.','Wpisuje jednowyrazową podpowiedź i przekazuje telefon.','Partner wybiera trzy słowa. Każde trafienie daje punkt.'],scoring:'Zgadujący i para dostają po 1 pkt za każde trafione słowo.'},
 story:{id:'story',icon:'⌛',title:'Nasza historia',tagline:'Wspomnienia, których nie warto zgubić.',description:'Pytania o pierwsze chwile, wspólne przełomy, małe rytuały i historie, które tworzą waszą relację.',duration:'10–35 min',difficulty:'Głębsza',instructions:['Czytacie pytanie i odpowiadacie kolejno.','Możecie zapisać kartę w ulubionych albo ją pominąć.','Nie ma złych odpowiedzi ani obowiązku odpowiadania na wszystko.'],scoring:'Ukończona rozmowa daje 1 punkt wspólny. Można też grać bez punktów.'},
 tell:{id:'tell',icon:'…',title:'Opowiedz mi',tagline:'Pytania, na które nie odpowiada się jednym słowem.',description:'Rozmowy o potrzebach, planach, wartościach, granicach i tym, co łatwo przeoczyć w codzienności.',duration:'10–40 min',difficulty:'Głębsza',instructions:['Odpowiadacie kolejno i słuchacie bez przerywania.','Możecie dopytać: „co sprawia, że tak czujesz?”.','Kartę można zawsze pominąć bez tłumaczenia.'],scoring:'Ukończona rozmowa daje 1 punkt wspólny. Najważniejsza jest rozmowa.'},
 challenge:{id:'challenge',icon:'+',title:'Wyzwania dla par',tagline:'Zróbcie coś, nie tylko o tym rozmawiajcie.',description:'Małe zadania na teraz i większe pomysły na wspólny czas. Część kart ma opcjonalny timer.',duration:'5–30 min',difficulty:'Lekka',instructions:['Czytacie wyzwanie i decydujecie, czy robicie je teraz.','Możecie uruchomić timer albo zapisać kartę na później.','Po wykonaniu oznaczacie kartę jako ukończoną.'],scoring:'Wykonane wyzwanie daje 1 punkt wspólny.'}
};
const MODE_ORDER=['wave','know','who','dilemma','scale','plan','words','story','tell','challenge'];
const MIX_PRESETS={
 quick:{title:'Szybki miks',icon:'⚡',description:'10 zróżnicowanych kart na 10–15 minut.',modes:['wave','know','who','dilemma','story','challenge'],intensity:2,categories:CATEGORIES},
 light:{title:'Na luzie',icon:'☺',description:'Dużo śmiechu, mało poważnych tematów.',modes:['who','dilemma','plan','words','challenge'],intensity:1,categories:['zabawne','codzienność','jedzenie','podróże','absurdalne']},
 romantic:{title:'Romantycznie',icon:'♡',description:'Bliskość, wspomnienia i wspólne plany.',modes:['know','wave','story','tell','challenge'],intensity:2,categories:['romantyczne','relacja','wspomnienia','przyszłość']},
 deep:{title:'Głębsza rozmowa',icon:'◌',description:'Potrzeby, przyszłość i ważne tematy.',modes:['know','story','tell','dilemma'],intensity:3,categories:['relacja','głębsze','przyszłość','wspomnienia']},
 travel:{title:'Podróżniczy wieczór',icon:'⌁',description:'Wyjazdy, marzenia i wakacyjne wybory.',modes:['wave','know','dilemma','story','challenge'],intensity:2,categories:['podróże','przyszłość','zabawne','wspomnienia']}
};

const parseLines=(text,mapper)=>text.trim().split('\n').map((line,index)=>mapper(line.split('|').map(x=>x.trim()),index));
const promptCards=(mode,text)=>parseLines(text,([prompt,category='codzienność',level='1'],i)=>({id:`${mode}-${i+1}`,mode,type:mode==='challenge'?'challenge':'conversation',prompt,category,level:+level}));
const choiceCards=(mode,text)=>parseLines(text,([prompt,options,category='codzienność',level='1'],i)=>({id:`${mode}-${i+1}`,mode,type:'choice',prompt,options:options.split(';'),category,level:+level}));
const scaleCards=(mode,text)=>parseLines(text,([prompt,low,high,category='codzienność',level='1'],i)=>({id:`${mode}-${i+1}`,mode,type:'scale',prompt,low,high,category,level:+level}));
const planCards=text=>parseLines(text,([title,positive1,positive2,twist,category='zabawne',level='1'],i)=>({id:`plan-${i+1}`,mode:'plan',type:'plan',title,positives:[positive1,positive2],twist,category,level:+level}));
const wordCards=text=>parseLines(text,([words,category='zabawne',level='1'],i)=>({id:`words-${i+1}`,mode:'words',type:'words',prompt:'Połącz trzy hasła jedną podpowiedzią',words:words.split(';'),category,level:+level}));

const waveCards=scaleCards('wave',`
Idealny weekend|zmarnowany czas|reset, o którym opowiadamy przez miesiąc|codzienność|1
Pierwsza randka|chcę uciec po 10 minutach|nie chcę, żeby ten wieczór się kończył|romantyczne|1
Prezent urodzinowy|zupełnie nietrafiony|prezent marzeń|romantyczne|1
Spontaniczny wyjazd|niepotrzebny chaos|najlepsza przygoda roku|podróże|1
Restauracja|nigdy więcej|rezerwujemy kolejny termin|jedzenie|1
Film na wieczór|zasnę po 10 minutach|obejrzę drugi raz|codzienność|1
Wspólne gotowanie|kuchenny koszmar|idealny wieczór|jedzenie|1
Miejsce do życia|uciekamy po tygodniu|zostajemy na zawsze|przyszłość|2
Romantyczny gest|przesada i niezręczność|dokładnie tego potrzebuję|romantyczne|2
Impreza ze znajomymi|szukam wymówki, żeby wyjść|najlepsza noc od dawna|zabawne|1
Śniadanie hotelowe|smutny tost|powód, żeby wrócić do hotelu|podróże|1
Domowy wieczór|nuda|najlepszy możliwy plan|codzienność|1
Wspólne hobby|porzucimy po tygodniu|nasza nowa tradycja|relacja|2
Dzień bez telefonu|kara|czysty spokój|codzienność|2
Niespodzianka|stres i chaos|idealne zaskoczenie|romantyczne|1
Wyjazd ze znajomymi|organizacyjny koszmar|legendarna historia|podróże|1
Zakup do mieszkania|zbędny gadżet|zmienia codzienność|przyszłość|1
Plan na Sylwestra|rozczarowanie|noc życia|zabawne|1
Wspólne zdjęcie|natychmiast usunąć|oprawiamy i wieszamy|wspomnienia|1
Długa podróż samochodem|męczarnia|część wakacji, którą wspominamy najlepiej|podróże|1
Spacer po mieście|bezcelowe krążenie|idealna randka|romantyczne|1
Rozmowa o finansach|unikam jej|czuję ulgę i bezpieczeństwo|głębsze|3
Pomysł na wspólny biznes|katastrofa|szansa życia|przyszłość|3
Niedzielny poranek|stracony dzień|najlepsza część tygodnia|codzienność|1
Wizyta u rodziny|obowiązek|naprawdę dobry czas|relacja|2
Wspólny trening|cierpienie|motywujący rytuał|codzienność|1
Urlop all inclusive|nuda przy basenie|pełen odpoczynek|podróże|1
Camping|walka o przetrwanie|wolność i przygoda|podróże|1
Wieczór karaoke|nie pokażę twarzy|śpiewamy do rana|zabawne|1
Wspólne zakupy|test cierpliwości|dobry czas razem|codzienność|1
Pies lub kot w domu|ciągły problem|pełnoprawny członek rodziny|przyszłość|2
Przeprowadzka do innego kraju|za duże ryzyko|początek najlepszego rozdziału|przyszłość|3
Powrót do miejsca pierwszej randki|niepotrzebny sentyment|piękny symbol|wspomnienia|2
Drobna kłótnia|psuje cały dzień|oczyszcza atmosferę|relacja|2
Wspólny serial|zapychacz czasu|nasz wieczorny rytuał|codzienność|1
Kolacja przy świecach|sztuczna scena|romantyczny klasyk|romantyczne|1
Wycieczka w góry|po co mi to było|widok wart każdego kroku|podróże|1
Plażowanie cały dzień|nuda|pełen relaks|podróże|1
Gra planszowa we dwoje|kłótnia o zasady|idealna rywalizacja|zabawne|1
Wspólna lista marzeń|puste hasła|plan na przyszłość|przyszłość|2
Rozmowa do późnej nocy|jutro będę żałować|chwila prawdziwej bliskości|głębsze|2
Powtórzenie pierwszych wakacji|nie da się odtworzyć|jeszcze lepiej niż wtedy|wspomnienia|2
Wspólne oszczędzanie|same ograniczenia|droga do marzenia|przyszłość|3
Podwójna randka|niezręczny obowiązek|świetny wspólny wieczór|zabawne|1
Domowe spa|mokre ręczniki wszędzie|pełen luksus|romantyczne|1
Nocny spacer|zimno i zmęczenie|magiczna atmosfera|romantyczne|1
Prezent zrobiony własnoręcznie|amatorszczyzna|najbardziej osobista rzecz|romantyczne|2
Wspólny projekt remontowy|wieczna kłótnia|satysfakcja na lata|przyszłość|2
Święta we dwoje|czegoś brakuje|nasza własna tradycja|relacja|2
Dzień totalnie bez planu|zmarnowany czas|idealna swoboda|codzienność|1
`);

const knowCards=choiceCards('know',`
Mam niespodziewany wolny dzień. Co wybiorę?|Wyjazd za miasto;Odpoczynek w domu;Spotkanie ze znajomymi;Załatwianie zaległych spraw|codzienność|1
Która niespodzianka najbardziej by mnie ucieszyła?|Zarezerwowany wyjazd;Ulubione jedzenie;Osobisty prezent;Wieczór zaplanowany od A do Z|romantyczne|1
Co najbardziej psuje mi wyjazd?|Zła pogoda;Opóźnienia;Słaby nocleg;Zbyt napięty plan|podróże|1
Gdy jestem zmęczony lub zmęczona, czego najbardziej potrzebuję?|Ciszy;Przytulenia;Jedzenia;Rozmowy|relacja|1
Co kupiłbym lub kupiłabym najpierw po dużej wygranej?|Mieszkanie;Samochód;Podróż;Nic, najpierw oszczędności|przyszłość|2
Który typ randki wybiorę najchętniej?|Restauracja;Domowy wieczór;Aktywna atrakcja;Spontaniczny wypad|romantyczne|1
Który posiłek mógłbym lub mogłabym jeść najczęściej?|Pizza;Makaron;Azjatyckie;Domowe klasyki|jedzenie|1
Co najczęściej odkładam na później?|Sprzątanie;Telefon lub wiadomość;Trening;Formalności|codzienność|1
Jak reaguję, gdy plan nagle się zmienia?|Szybko się dostosowuję;Najpierw się denerwuję;Przejmuję organizację;Wolę zrezygnować|relacja|2
Gdzie najchętniej spędziłbym lub spędziłabym miesiąc?|Nad morzem;W górach;W wielkim mieście;Na spokojnej wsi|podróże|1
Jaki prezent wolę dostać?|Praktyczny;Romantyczny;Wspólne doświadczenie;Coś, o czym wspominałem lub wspominałam|romantyczne|1
Co najszybciej poprawia mi humor?|Jedzenie;Sen;Żart;Bliskość|relacja|1
Który wydatek najłatwiej sobie usprawiedliwię?|Podróże;Technologia;Ubrania;Jedzenie na mieście|codzienność|1
Jaką rolę naturalnie przejmuję w grupie?|Organizator;Rozładowuję atmosferę;Obserwator;Rozwiązuję problemy|zabawne|1
Co bardziej mnie stresuje?|Spóźnienie;Brak pieniędzy;Konflikt;Brak kontroli nad planem|głębsze|2
Który wspólny plan wybrałbym na dziś?|Spacer;Film;Wyjście do miasta;Gotowanie|codzienność|1
Gdybym miał lub miała nauczyć się czegoś nowego, co wybiorę?|Język;Taniec;Gotowanie;Sport|przyszłość|1
Co najbardziej cenię w wakacjach?|Widoki;Jedzenie;Odpoczynek;Nowe doświadczenia|podróże|1
Co wybiorę w hotelu?|Lepszy widok;Lepsze śniadanie;Lepszą lokalizację;Większy pokój|podróże|1
Jaki wieczór jest dla mnie najbardziej regenerujący?|Samotny spokój;Czas we dwoje;Spotkanie ze znajomymi;Aktywność fizyczna|codzienność|2
Której rzeczy najtrudniej byłoby mi się pozbyć?|Telefon;Samochód;Pamiątki;Ulubione ubrania|zabawne|1
Jak najczęściej podejmuję ważne decyzje?|Analizuję wszystko;Idę za intuicją;Pytam innych;Odwlekam|głębsze|2
Co najchętniej zaplanuję z dużym wyprzedzeniem?|Wakacje;Finanse;Weekend;Prezenty|przyszłość|1
Który typ humoru najbardziej mnie bawi?|Suchary;Ironia;Absurd;Żarty sytuacyjne|zabawne|1
Co zrobię podczas długiego postoju w podróży?|Pójdę coś zjeść;Zasypiam;Zwiedzam okolicę;Sprawdzam opóźnienie co minutę|podróże|1
Co najbardziej lubię dostawać w wiadomościach?|Memy;Miłe słowa;Konkretne plany;Zdjęcia z dnia|relacja|1
Które domowe zadanie najmniej mi przeszkadza?|Gotowanie;Odkurzanie;Zakupy;Pranie|codzienność|1
Gdybym zmienił lub zmieniła pracę, co byłoby najważniejsze?|Zarobki;Spokój;Rozwój;Elastyczny czas|przyszłość|2
Jaki klimat mieszkania wybiorę?|Nowoczesny;Przytulny;Minimalistyczny;Kolorowy i osobisty|przyszłość|1
Co wolę podczas zwiedzania?|Najważniejsze atrakcje;Ukryte miejsca;Jedzenie;Spontaniczny spacer|podróże|1
Jak najchętniej świętuję sukces?|Kolacją;Wyjazdem;Zakupem;W domu z bliskimi|relacja|1
Co najbardziej mnie przekonuje w sporze?|Fakty;Spokojny ton;Przykład;Czas na przemyślenie|głębsze|3
Gdybym mógł lub mogła mieć jedną supermoc, co wybiorę?|Teleportację;Czytanie w myślach;Zatrzymywanie czasu;Niewidzialność|absurdalne|1
Jaką pogodę wybiorę na idealny dzień?|Pełne słońce;Lekki chłód;Ciepły deszcz;Śnieg|zabawne|1
Co zrobię najpierw po powrocie z podróży?|Rozpakuję się;Zamówię jedzenie;Wezmę prysznic;Położę się|podróże|1
Jakie wspomnienie zachowuję najchętniej?|Zdjęcie;Bilet lub drobiazg;Film;Samą historię|wspomnienia|1
Który kompromis przychodzi mi najtrudniej?|Pieniądze;Czas;Plan wyjazdu;Kontakty z innymi|głębsze|3
Jak najchętniej spędzę urodziny?|Duża impreza;Wyjazd;Kolacja we dwoje;Spokojny dzień|romantyczne|1
Co byłoby dla mnie gorsze przez tydzień?|Brak internetu;Brak słodyczy;Brak samochodu;Brak seriali|zabawne|1
Który wspólny cel najbardziej mnie ekscytuje?|Podróż;Wspólne mieszkanie;Projekt lub biznes;Lepsza forma|przyszłość|2
Jak reaguję na niespodziewany prezent?|Od razu się cieszę;Najpierw pytam po co;Czuję się niezręcznie;Chcę natychmiast się odwdzięczyć|romantyczne|2
Który zapach kojarzy mi się najlepiej?|Kawa;Morze;Las;Świeże pranie|wspomnienia|1
Co najchętniej zamówię na deser?|Czekoladowe;Owocowe;Lody;Nic, wolę coś słonego|jedzenie|1
Jakiego typu zdjęcia robię najczęściej?|Ludzi;Widoki;Jedzenie;Zabawne przypadkowe momenty|wspomnienia|1
Co jest dla mnie ważniejsze w domu?|Porządek;Wygoda;Wygląd;Dobra lokalizacja|przyszłość|2
Jak odpoczywam po trudnym tygodniu?|Śpię;Wychodzę z domu;Gram lub oglądam;Spędzam czas z bliskimi|codzienność|1
Której cechy najbardziej szukam u ludzi?|Szczerości;Humoru;Lojalności;Ambicji|głębsze|2
Jaką pamiątkę z podróży wybiorę?|Magnes;Lokalne jedzenie;Zdjęcie;Coś praktycznego|podróże|1
Co zrobię, gdy zgubimy drogę?|Sprawdzę mapę;Zapytam kogoś;Będę improwizować;Zacznę się denerwować|podróże|1
Który sposób okazywania uczuć jest mi najbliższy?|Słowa;Dotyk;Pomoc;Wspólny czas|relacja|2
`);

const whoCards=promptCards('who',`
Kto częściej mówi „zaraz”, mając na myśli co najmniej pół godziny?|zabawne|1
Kto szybciej przeprasza po kłótni?|relacja|2
Kto lepiej planuje wyjazdy?|podróże|1
Kto częściej kupuje coś, czego nie planował?|codzienność|1
Kto pierwszy zauważy, że w domu czegoś brakuje?|codzienność|1
Kto dłużej szykuje się do wyjścia?|zabawne|1
Kto szybciej zasypia podczas filmu?|zabawne|1
Kto częściej zaczyna rozmowę o przyszłości?|przyszłość|2
Kto lepiej zachowuje spokój w stresie?|relacja|2
Kto częściej zmienia zdanie w ostatniej chwili?|zabawne|1
Kto lepiej pamięta ważne daty?|wspomnienia|1
Kto pierwszy zaproponuje spontaniczny wyjazd?|podróże|1
Kto częściej podjada jedzenie drugiej osoby?|jedzenie|1
Kto lepiej radzi sobie z mapą i nawigacją?|podróże|1
Kto częściej robi zdjęcia podczas wyjazdu?|podróże|1
Kto szybciej wydaje pieniądze po wypłacie?|codzienność|1
Kto częściej potrzebuje pobyć sam lub sama?|relacja|2
Kto ma więcej cierpliwości do urzędów i formalności?|codzienność|1
Kto pierwszy proponuje kompromis?|relacja|2
Kto częściej rozładowuje napięcie żartem?|zabawne|1
Kto lepiej wybiera prezenty?|romantyczne|1
Kto częściej zapomina, po co wszedł do pokoju?|zabawne|1
Kto lepiej pilnuje wspólnego budżetu?|przyszłość|2
Kto szybciej nawiązuje kontakt z obcymi ludźmi?|zabawne|1
Kto częściej ma rację w sprawie pogody?|absurdalne|1
Kto pierwszy wstaje podczas wakacji?|podróże|1
Kto częściej namawia na deser?|jedzenie|1
Kto lepiej gotuje bez przepisu?|jedzenie|1
Kto szybciej wpada na rozwiązanie problemu?|codzienność|1
Kto częściej potrzebuje potwierdzenia, że wszystko jest dobrze?|relacja|2
Kto lepiej pamięta szczegóły pierwszych miesięcy związku?|wspomnienia|2
Kto częściej robi niespodzianki bez okazji?|romantyczne|1
Kto bardziej przeżywa krytykę?|głębsze|2
Kto szybciej zaprzyjaźniłby się z sąsiadami?|zabawne|1
Kto częściej mówi przez sen?|absurdalne|1
Kto lepiej pakuje walizkę?|podróże|1
Kto częściej bierze za dużo rzeczy na wyjazd?|podróże|1
Kto szybciej zgodzi się na zwierzę w domu?|przyszłość|1
Kto częściej odkłada sprzątanie na później?|codzienność|1
Kto lepiej organizuje romantyczny wieczór?|romantyczne|1
Kto częściej zaczyna trudną rozmowę?|głębsze|3
Kto bardziej boi się zmian?|głębsze|2
Kto szybciej podejmie decyzję o przeprowadzce?|przyszłość|2
Kto częściej proponuje nową restaurację?|jedzenie|1
Kto lepiej negocjuje ceny?|codzienność|1
Kto częściej pamięta słowa piosenek?|zabawne|1
Kto pierwszy zauważy, że druga osoba ma gorszy dzień?|relacja|2
Kto częściej przesadza z planowaniem?|zabawne|1
Kto lepiej odpoczywa bez poczucia winy?|głębsze|2
Kto częściej mówi „wszystko jedno”, a potem ma zdanie?|zabawne|1
`);

const dilemmaCards=choiceCards('dilemma',`
Miesiąc bez seriali czy miesiąc bez restauracji?|Bez seriali;Bez restauracji|codzienność|1
Wakacje luksusowe 3 dni czy budżetowe 10 dni?|3 dni luksusu;10 dni budżetowo|podróże|1
Zawsze znać prawdę czy czasem żyć w błogiej niewiedzy?|Zawsze prawda;Czasem niewiedza|głębsze|3
Spontaniczny wyjazd jutro czy perfekcyjny plan za pół roku?|Jutro;Za pół roku|podróże|1
Dom w centrum czy większy dom daleko od miasta?|Centrum;Poza miastem|przyszłość|2
Wspólny biznes czy całkowicie osobne kariery?|Wspólny biznes;Osobne kariery|przyszłość|3
Rok bez słodyczy czy rok bez alkoholu?|Bez słodyczy;Bez alkoholu|zabawne|1
Codziennie wstawać o 5:00 czy codziennie kłaść się po 1:00?|Wstawać o 5:00;Spać po 1:00|absurdalne|1
Zgubić wszystkie zdjęcia czy wszystkie wiadomości?|Zdjęcia;Wiadomości|wspomnienia|2
Zawsze mówić, co myślisz, czy nigdy nie móc narzekać?|Mówić wszystko;Nigdy nie narzekać|głębsze|2
Kolacja bez telefonów czy weekend bez internetu?|Kolacja bez telefonów;Weekend bez internetu|relacja|1
Wspólny samochód marzeń czy dwa zwykłe samochody?|Jeden wymarzony;Dwa zwykłe|przyszłość|1
Mieszkać rok nad morzem czy rok w górach?|Nad morzem;W górach|podróże|1
Znać datę największego sukcesu czy największej porażki?|Sukcesu;Porażki|głębsze|3
Zawsze planować randki czy zawsze działać spontanicznie?|Planować;Spontanicznie|romantyczne|1
Mieć świetne mieszkanie w złej lokalizacji czy przeciętne w idealnej?|Świetne mieszkanie;Idealna lokalizacja|przyszłość|2
Nigdy więcej nie gotować czy nigdy więcej nie zamawiać jedzenia?|Nie gotować;Nie zamawiać|jedzenie|1
Podróżować tylko latem czy tylko zimą?|Latem;Zimą|podróże|1
Wiedzieć, co partner myśli, czy móc cofnąć jedną kłótnię?|Czytać myśli;Cofnąć kłótnię|relacja|2
Przeżyć ponownie pierwszą randkę czy najlepsze wakacje?|Pierwsza randka;Najlepsze wakacje|wspomnienia|1
Mieć więcej czasu czy więcej pieniędzy?|Czas;Pieniądze|przyszłość|2
Zawsze wybierać film czy zawsze wybierać restaurację?|Film;Restaurację|zabawne|1
Zorganizować wielkie wesele czy długą podróż poślubną?|Wielkie wesele;Długa podróż|romantyczne|2
Nigdy się nie spóźniać czy nigdy niczego nie zapominać?|Nie spóźniać się;Nie zapominać|codzienność|1
Mieć dom pełen zwierząt czy dom pełen roślin?|Zwierzęta;Rośliny|przyszłość|1
Spędzić tydzień w namiocie czy tydzień bez wychodzenia z hotelu?|Namiot;Hotel|podróże|1
Zawsze jeść śniadanie na słodko czy zawsze na słono?|Słodko;Słono|jedzenie|1
Oddać telefon na tydzień czy samochód na miesiąc?|Telefon;Samochód|codzienność|1
Móc teleportować się czy zatrzymywać czas?|Teleportacja;Zatrzymanie czasu|absurdalne|1
Nigdy więcej nie robić zdjęć czy nigdy ich nie oglądać?|Nie robić;Nie oglądać|wspomnienia|2
Mieć zawsze rację czy zawsze szybko się godzić?|Mieć rację;Szybko się godzić|relacja|2
Wspólnie oszczędzać na jedno marzenie czy każde na własne?|Jedno wspólne;Dwa osobne|przyszłość|3
Randka za 50 zł z pomysłem czy za 500 zł bez pomysłu?|50 zł z pomysłem;500 zł bez pomysłu|romantyczne|1
Rok podróżować kamperem czy rok mieszkać w jednym luksusowym miejscu?|Kamper;Jedno miejsce|podróże|1
Mieć idealną pamięć czy nigdy się nie stresować?|Idealna pamięć;Brak stresu|głębsze|2
Zawsze słuchać tej samej muzyki czy oglądać te same filmy?|Muzyka;Filmy|zabawne|1
Zjeść bardzo ostre danie czy bardzo dziwny deser?|Ostre danie;Dziwny deser|jedzenie|1
Mieszkać obok rodziny czy bardzo daleko, ale w wymarzonym miejscu?|Blisko rodziny;Wymarzone miejsce|przyszłość|3
Wygrać podróż bez możliwości wyboru kierunku czy dostać połowę jej wartości?|Losowa podróż;Połowa pieniędzy|podróże|1
Znać wszystkie przyszłe plany partnera czy wszystkie jego wspomnienia?|Plany;Wspomnienia|głębsze|3
Zawsze mówić dobranoc czy zawsze jeść razem śniadanie?|Dobranoc;Śniadanie|romantyczne|1
Mieć jedną wspólną pasję czy wiele osobnych zainteresowań?|Jedna wspólna;Wiele osobnych|relacja|2
Przez miesiąc zamieniać się obowiązkami czy telefonami?|Obowiązki;Telefony|zabawne|1
Nigdy więcej nie korzystać z mapy czy prognozy pogody?|Mapa;Pogoda|absurdalne|1
Mieć piękny widok z okna czy pięć minut do pracy?|Widok;Blisko pracy|przyszłość|1
Spędzić Sylwestra na wielkiej imprezie czy tylko we dwoje?|Impreza;We dwoje|romantyczne|1
Przyznać się od razu do błędu czy najpierw wszystko przemyśleć?|Od razu;Po namyśle|relacja|2
Zawsze jechać na wakacje w nowe miejsce czy wracać do ulubionego?|Nowe miejsca;Ulubione miejsce|podróże|1
Móc usunąć jedno złe wspomnienie czy zachować każdy szczegół dobrego?|Usunąć złe;Zachować dobre|wspomnienia|3
Zjeść kolację w ciemności czy w całkowitej ciszy?|W ciemności;W ciszy|absurdalne|1
`);

const scaleCardsData=scaleCards('scale',`
Jak romantyczna powinna być wasza następna randka?|zupełnie na luzie|filmowa scena|romantyczne|1
Jak odważny ma być pomysł na wspólny weekend?|pełen spokój|historia, o której będziemy opowiadać latami|podróże|1
Jak luksusowy powinien być idealny hotel?|łóżko i prysznic wystarczą|królewski apartament|podróże|1
Jak szalony może być prezent bez okazji?|drobny gest|kompletne zaskoczenie|romantyczne|1
Jak spontaniczny może być plan na jutro?|wszystko zapisane|wychodzimy bez pytania dokąd|codzienność|1
Jak wymagające ma być wspólne wyzwanie?|prawie bez wysiłku|test charakteru|zabawne|1
Jak ważne jest wspólne śniadanie?|miły dodatek|święty rytuał|relacja|1
Jak mocno przeżywasz spóźnienia?|wcale|katastrofa dnia|codzienność|1
Jak bardzo lubisz niespodzianki?|wolę wszystko wiedzieć|zaskakuj mnie zawsze|romantyczne|2
Jak dokładnie planujesz wakacje?|tylko bilet|harmonogram co do minuty|podróże|1
Jak trudno byłoby ci żyć bez telefonu?|bez problemu|niemożliwe|codzienność|1
Jak ważny jest wygląd mieszkania?|byle wygodnie|każdy detal ma znaczenie|przyszłość|1
Jak bardzo lubisz rywalizację w grach?|wynik nieważny|gram po zwycięstwo|zabawne|1
Jak szybko wybaczasz drobne błędy?|potrzebuję czasu|natychmiast odpuszczam|relacja|2
Jak duża ma być impreza urodzinowa?|tylko my|wszyscy, których znamy|zabawne|1
Jak mocno odczuwasz potrzebę podróży?|mogę zostać w domu|ciągle chcę gdzieś jechać|podróże|1
Jak ważne są prezenty materialne?|prawie wcale|bardzo mocno|romantyczne|2
Jak często potrzebujesz czasu tylko dla siebie?|niemal nigdy|codziennie|relacja|2
Jak poważnie traktujesz horoskopy i znaki?|czysta zabawa|to coś tłumaczy|absurdalne|1
Jak bardzo lubisz gotować dla drugiej osoby?|raczej zamówię|to mój język miłości|jedzenie|1
Jak dużą rolę odgrywa pieniądz w poczuciu bezpieczeństwa?|niewielką|ogromną|głębsze|3
Jak chętnie zamieszkałbyś lub zamieszkałabyś za granicą?|nie chcę wyjeżdżać|pakuję się jutro|przyszłość|2
Jak bardzo lubisz wracać do starych zdjęć?|prawie nigdy|regularnie się wzruszam|wspomnienia|1
Jak długo potrafisz być bez planu na dzień?|godzinę|cały tydzień|codzienność|1
Jak mocno przeżywasz krytykę?|szybko zapominam|myślę o niej długo|głębsze|2
Jak bardzo cenisz wspólne rytuały?|nie są potrzebne|budują całą relację|relacja|2
Jak odważnie eksperymentujesz z jedzeniem?|tylko znane smaki|spróbuję wszystkiego|jedzenie|1
Jak często chcesz poznawać nowych ludzi?|rzadko|przy każdej okazji|zabawne|1
Jak duże znaczenie ma punktualność?|pięć minut nic nie zmienia|każda minuta ma znaczenie|codzienność|1
Jak romantyczne powinny być rocznice?|zwykły dzień|wielkie święto|romantyczne|2
Jak bardzo chcesz mieć wspólny długoterminowy plan?|zobaczymy, co będzie|konkrety na kilka lat|przyszłość|3
Jak łatwo mówisz o swoich potrzebach?|bardzo trudno|zupełnie naturalnie|głębsze|3
Jak ważna jest dla ciebie cisza w domu?|nie przeszkadza mi hałas|potrzebuję jej codziennie|codzienność|2
Jak dużo czasu potrzebujesz, by podjąć ważną decyzję?|chwila|wiele tygodni|przyszłość|2
Jak bardzo lubisz publiczne okazywanie uczuć?|unikam|uwielbiam|romantyczne|2
Jak mocno przywiązujesz się do miejsc?|prawie wcale|miejsce staje się częścią mnie|wspomnienia|2
Jak bardzo potrzebujesz porządku?|odnajduję się w chaosie|wszystko ma swoje miejsce|codzienność|1
Jak długo możesz podróżować bez wygód?|jedna noc|wiele tygodni|podróże|1
Jak poważnie traktujesz małe obietnice?|liczy się intencja|każda obietnica jest ważna|relacja|2
Jak wielkim marzeniem jest własny dom?|nie jest potrzebny|jeden z głównych celów|przyszłość|2
`);

const planCardsData=planCards(`
Darmowy tydzień na Malediwach|Piękny hotel|Pełne wyżywienie|Lecicie z parą, której oboje nie znosicie|podróże|1
Mieszkanie marzeń za pół ceny|Idealna lokalizacja|Piękny widok|Sąsiad codziennie ćwiczy na perkusji|przyszłość|1
Kolacja w najlepszej restauracji miasta|Wszystko gratis|Stolik przy oknie|Telefon zostaje w depozycie na całą noc|jedzenie|1
Rok bez opłat za samochód|Pełne ubezpieczenie|Darmowe paliwo|Samochód jest jaskrawo różowy|zabawne|1
Weekend w luksusowym spa|Wszystkie zabiegi gratis|Apartament tylko dla was|Budzik na każdy zabieg zaczyna dzwonić o 6:00|romantyczne|1
Domek w górach na własność|Kominek|Niesamowity widok|Do najbliższego sklepu są dwie godziny|podróże|1
Wymarzony koncert w pierwszym rzędzie|Spotkanie z artystą|Darmowe napoje|Musicie mieć identyczne kostiumy sceniczne|zabawne|1
Podróż dookoła świata|Wszystkie bilety opłacone|Najlepsze hotele|Plan każdej godziny ustala obca osoba|podróże|2
Nowy dom z ogromnym ogrodem|Brak kredytu|Wymarzona kuchnia|Przez pięć lat nie możecie niczego przemalować|przyszłość|2
Karta do wszystkich restauracji za darmo|Dowolne danie|Bez limitu wizyt|Zawsze wybiera dla was szef kuchni|jedzenie|1
Miesiąc wolnego od pracy|Pełne wynagrodzenie|Brak obowiązków|Nie wolno opuścić własnego miasta|codzienność|1
Prywatny kierowca na rok|Dostępny całą dobę|Każdy samochód|Zawsze prowadzi wasz najbardziej gadatliwy znajomy|zabawne|1
Idealne wesele całkowicie za darmo|Wymarzone miejsce|Dowolne menu|Listę gości ustala rodzina|romantyczne|2
Wakacje w tajemniczym kierunku|Pierwsza klasa|Luksusowy hotel|Kierunek poznajecie dopiero po wylądowaniu|podróże|1
Wspólna firma od pierwszego dnia przynosi zysk|Duże zarobki|Pełna swoboda|Musicie pracować przy jednym biurku|przyszłość|2
Mieszkanie pięć minut od pracy|Niski czynsz|Dobra komunikacja|W salonie nie ma żadnego okna|przyszłość|1
Domowe kino marzeń|Ogromny ekran|Najlepszy dźwięk|Możecie oglądać tylko filmy sprzed 2000 roku|zabawne|1
Własna restauracja|Pełna sala codziennie|Świetny zespół|W menu musi zostać danie, którego oboje nie lubicie|jedzenie|2
Rok podróży kamperem|Wszystkie koszty pokryte|Dowolna trasa|Nie możecie nocować dwa razy w tym samym kraju|podróże|2
Idealnie urządzona sypialnia|Najwygodniejsze łóżko|Pełne wygłuszenie|Światło zawsze włącza się o 7:00|codzienność|1
Darmowe zakupy przez jeden dzień|Brak limitu kwoty|Dowolny sklep|Macie tylko jedną godzinę i jedną wspólną torbę|zabawne|1
Roczny abonament na randki|Co tydzień nowa atrakcja|Wszystko opłacone|Nigdy nie wiecie, co będziecie robić|romantyczne|1
Wyjazd na bezludną wyspę|Piękna plaża|Pełne zapasy|Macie tylko jeden telefon bez internetu|podróże|1
Własny basen przy domu|Podgrzewana woda|Piękne otoczenie|Raz w tygodniu korzystają z niego wszyscy sąsiedzi|przyszłość|1
Zawsze idealna pogoda na wakacjach|Słońce według potrzeb|Brak deszczu|W domu przez resztę roku pada codziennie|absurdalne|1
Możecie cofnąć jeden dzień|Pamiętacie wszystko|Zmienia się wynik|Musicie przeżyć go ponownie dokładnie razem|wspomnienia|3
Wygrywacie milion złotych|Bez podatku|Pieniądze od razu|Całość musicie wydać wspólnie w 30 dni|przyszłość|2
Idealny pies trafia do waszego domu|Mądry i spokojny|Nie gubi sierści|Budzi was codziennie o 5:30|przyszłość|1
Darmowe jedzenie na dowóz przez rok|Dowolna kuchnia|Bez limitu|Każde zamówienie przychodzi godzinę za wcześnie|jedzenie|1
Własny apartament nad morzem|Widok z tarasu|Bez opłat|Możecie być tam tylko poza sezonem|podróże|1
Wymarzona garderoba|Pełna ubrań|Dopasowane rozmiary|Nie możecie niczego dokupić przez dwa lata|zabawne|1
Rok bez sprzątania|Ktoś robi wszystko|Pełny porządek|Osoba sprzątająca codziennie komentuje wasze nawyki|codzienność|1
Wspólny kurs dowolnej umiejętności|Najlepszy nauczyciel|Pełne wyposażenie|Egzamin końcowy jest transmitowany na żywo|zabawne|1
Dom w miejscu z najpiękniejszym widokiem|Pełna cisza|Wysoki standard|Internet działa tylko dwie godziny dziennie|przyszłość|2
Możecie jeść bez konsekwencji zdrowotnych|Dowolne ilości|Zawsze idealna forma|Każde danie smakuje trochę jak brokuły|absurdalne|1
Podróż w czasie na pierwszą randkę|Pamiętacie przyszłość|Możecie obserwować siebie|Nie wolno wam nic powiedzieć|wspomnienia|2
Idealna rocznica w Paryżu|Luksusowy hotel|Prywatna kolacja|Cały dzień pada ulewny deszcz|romantyczne|1
Nowa praca dla obojga|Dwa razy wyższe zarobki|Cztery dni pracy|Pracujecie w przeciwnych godzinach|przyszłość|3
Darmowy remont całego mieszkania|Najlepsze materiały|Gotowe w tydzień|Kolory wybiera losowanie|zabawne|1
Każda wspólna podróż jest darmowa|Dowolny kierunek|Brak limitu|Nie możecie robić żadnych zdjęć|podróże|2
`);

const wordBoards=wordCards(`
miłość;dom;podróż;kawa;film;deszcz;muzyka;sen;plaża;prezent;las;śmiech|relacja|1
noc;miasto;ogień;lód;serce;czas;droga;sekret;telefon;wino;góry;taniec|zabawne|1
wakacje;hotel;mapa;słońce;pociąg;restauracja;zdjęcie;most;ogród;książka;spacer;burza|podróże|1
pizza;makaron;czekolada;śniadanie;kuchnia;kolacja;ser;owoce;kawa;grill;zupa;deser|jedzenie|1
Warszawa;morze;samochód;walizka;lotnisko;bilet;droga;hotel;widok;plaża;góry;mapa|podróże|1
kanapa;koc;serial;herbata;świeca;deszcz;cisza;sen;książka;muzyka;kot;wieczór|codzienność|1
pierwsza randka;pierwszy pocałunek;wiadomość;zdjęcie;rocznica;prezent;podróż;śmiech;telefon;park;restauracja;noc|wspomnienia|2
praca;urlop;budżet;dom;dziecko;zwierzę;samochód;miasto;marzenie;plan;zmiana;decyzja|przyszłość|2
zaufanie;bliskość;granica;wsparcie;rozmowa;cisza;szczerość;czas;dotyk;pomoc;obietnica;spokój|relacja|2
kosmita;jednorożec;wulkan;pirat;robot;duch;magia;księżyc;smok;wehikuł;supermoc;dinozaur|absurdalne|1
lato;zima;jesień;wiosna;śnieg;upał;wiatr;deszcz;słońce;burza;mgła;tęcza|zabawne|1
rower;bieganie;siłownia;basen;spacer;góry;narty;taniec;joga;mecz;rakieta;piłka|codzienność|1
telefon;ładowarka;internet;hasło;aplikacja;zdjęcie;wiadomość;film;gra;komputer;słuchawki;zegar|codzienność|1
rodzina;przyjaciel;sąsiad;szef;kolega;dziecko;babcia;gość;para;zespół;znajomy;obcy|relacja|1
lot;rejs;pociąg;autobus;rower;kamper;prom;taksówka;metro;spacer;autostop;samochód|podróże|1
randka;kwiaty;list;świeca;kolacja;muzyka;dotyk;spacer;prezent;pocałunek;zachód słońca;hotel|romantyczne|1
pieniądze;kredyt;oszczędności;zakupy;rachunek;praca;premia;portfel;cena;plan;cel;ryzyko|przyszłość|2
klucz;drzwi;okno;schody;dach;piwnica;kuchnia;łóżko;stół;lustro;ogród;balkon|codzienność|1
sukces;porażka;odwaga;strach;zmiana;nawyk;cel;wybór;próba;nauka;czas;szansa|głębsze|2
muzyka;koncert;gitara;piosenka;refren;głos;radio;taniec;scena;bilet;słuchawki;melodia|zabawne|1
kino;aktor;popcorn;ekran;finał;serial;komedia;horror;napisy;premiera;bohater;zwiastun|zabawne|1
las;jezioro;rzeka;góra;łąka;kamień;drzewo;plaża;wyspa;wodospad;szlak;chmura|podróże|1
poranek;budzik;prysznic;kawa;śniadanie;praca;tramwaj;sen;łóżko;wiadomość;słońce;pośpiech|codzienność|1
wieczór;kolacja;kanapa;serial;spacer;rozmowa;telefon;cisza;światło;sen;muzyka;koc|codzienność|1
święta;choinka;prezent;rodzina;kolęda;stół;śnieg;lampki;tradycja;ciasto;gość;życzenia|wspomnienia|1
urodziny;tort;świeczka;prezent;goście;życzenia;balon;muzyka;zdjęcie;niespodzianka;kolacja;rok|wspomnienia|1
lotnisko;paszport;bagaż;bramka;samolot;bilet;kontrola;opóźnienie;kawa;okno;start;lądowanie|podróże|1
restauracja;menu;kelner;stolik;rachunek;deser;wino;kuchnia;rezerwacja;smak;serwetka;świeca|jedzenie|1
przeprowadzka;karton;klucz;adres;sąsiad;remont;mebel;ściana;samochód;pomoc;bałagan;początek|przyszłość|2
kłótnia;cisza;przeprosiny;argument;emocja;czas;rozmowa;kompromis;złość;dotyk;spokój;wniosek|głębsze|3
marzenie;lista;podróż;dom;praca;rodzina;wolność;spokój;przygoda;plan;odwaga;czas|przyszłość|2
pies;kot;smycz;miska;spacer;sierść;kanapa;weterynarz;zabawka;łapa;sen;dom|zabawne|1
samochód;kluczyk;paliwo;radio;korek;droga;parking;mandat;mapa;myjnia;opona;podróż|codzienność|1
zakupy;koszyk;lista;promocja;kasa;paragon;torba;sklep;cena;kolejka;produkt;karta|codzienność|1
sen;poduszka;kołdra;budzik;noc;marzenie;cisza;chrapanie;światło;łóżko;zmęczenie;poranek|zabawne|1
woda;ogień;ziemia;powietrze;lód;para;piasek;kamień;deszcz;słońce;wiatr;cień|absurdalne|1
szczęście;spokój;zaufanie;radość;wdzięczność;duma;nadzieja;odwaga;bliskość;wolność;bezpieczeństwo;miłość|głębsze|2
zegarek;kalendarz;minuta;rok;przeszłość;przyszłość;termin;spóźnienie;chwila;weekend;urlop;rocznica|głębsze|2
Warszawa;Kraków;Gdańsk;Paryż;Rzym;Londyn;Praga;Split;Reykjavik;Palermo;Wiedeń;Berlin|podróże|1
chipsy;cola;pizza;lody;burger;popcorn;czekolada;kebab;frytki;ciastko;ser;wino|jedzenie|1
`);

const storyCards=promptCards('story',`
Jaki był moment, w którym pierwszy raz pomyślałeś lub pomyślałaś, że to może być coś poważnego?|wspomnienia|2
Które wspólne wspomnienie zawsze poprawia ci humor?|wspomnienia|1
Jaka mała rzecz z początku relacji najbardziej utkwiła ci w pamięci?|wspomnienia|1
Który wspólny wyjazd zmienił coś między wami?|podróże|2
Z czego jako para jesteście najbardziej dumni?|relacja|2
Jakie wspólne zdjęcie najlepiej opowiada waszą historię?|wspomnienia|1
Jak zapamiętałeś lub zapamiętałaś pierwszą dłuższą rozmowę?|wspomnienia|1
Która pierwsza wspólna decyzja była naprawdę ważna?|wspomnienia|2
Jaki drobny rytuał powstał między wami przypadkiem?|codzienność|1
Kiedy najbardziej poczułeś lub poczułaś, że możecie na sobie polegać?|relacja|2
Który dzień chętnie przeżyłbyś lub przeżyłabyś jeszcze raz?|wspomnienia|1
Jaki wspólny żart rozumiecie tylko wy?|zabawne|1
Jaka była wasza najbardziej nieudana randka i dlaczego dziś jest zabawna?|zabawne|1
Który prezent miał dla ciebie większe znaczenie, niż druga osoba mogła przypuszczać?|romantyczne|2
Co pamiętasz z pierwszego spotkania, czego druga osoba może nie pamiętać?|wspomnienia|1
Kiedy po raz pierwszy zobaczyłeś lub zobaczyłaś partnera w zupełnie nowej roli?|wspomnienia|2
Jaki wspólny problem ostatecznie was wzmocnił?|głębsze|3
Które wakacyjne wspomnienie ma najlepszą historię w tle?|podróże|1
Jak zmieniliście się od początku relacji?|głębsze|3
Jaki komplement od partnera pamiętasz do dziś?|romantyczne|2
Który wspólny posiłek wspominasz najlepiej?|jedzenie|1
Jaki był wasz najbardziej spontaniczny wspólny plan?|wspomnienia|1
Kiedy ostatnio pomyślałeś lub pomyślałaś: „dobrze, że jesteśmy razem”?|relacja|2
Jaka rzecz, która kiedyś was różniła, dziś was bawi?|zabawne|1
Jak wyglądał pierwszy moment, w którym poznaliście swoich bliskich?|wspomnienia|1
Który wspólny zakup miał największy wpływ na codzienność?|codzienność|1
Jakie miejsce stało się „waszym miejscem”?|romantyczne|1
Jaki kryzys organizacyjny na wyjeździe dziś wspominacie z uśmiechem?|podróże|1
Która rozmowa najbardziej zmieniła sposób, w jaki się rozumiecie?|głębsze|3
Jakie pierwsze wrażenie o partnerze okazało się całkowicie błędne?|zabawne|1
Jaki etap relacji był dla was największą zmianą?|wspomnienia|2
Która wspólna tradycja jest dla ciebie najważniejsza?|relacja|2
Jaki był najbardziej zaskakujący moment waszej relacji?|wspomnienia|1
Kiedy partner zrobił coś małego, co miało ogromne znaczenie?|romantyczne|2
Jakie wspólne osiągnięcie kosztowało was najwięcej pracy?|przyszłość|2
Które słowo lub zdanie kojarzy ci się z początkiem waszej relacji?|wspomnienia|1
Jaka piosenka najlepiej pasuje do konkretnego etapu waszej historii?|wspomnienia|1
Co zrobiliście razem pierwszy raz dopiero dzięki tej relacji?|wspomnienia|1
Jak wyglądała wasza pierwsza wspólna podróż od strony organizacji?|podróże|1
Która chwila była kompletnie zwyczajna, ale została w pamięci?|wspomnienia|2
Jaka zmiana w partnerze najbardziej cię cieszy?|relacja|2
Co z początku relacji zachowalibyście dokładnie bez zmian?|romantyczne|2
Jaka historia najlepiej pokazuje, jak różne macie charaktery?|zabawne|1
Który wspólny wieczór był idealny mimo braku planu?|wspomnienia|1
Co kiedyś wydawało się trudne, a dziś robicie naturalnie?|relacja|2
Jakie miejsce chcielibyście kiedyś odwiedzić ponownie ze względu na wspomnienia?|podróże|2
Kiedy po raz pierwszy poczułeś lub poczułaś się naprawdę wysłuchany lub wysłuchana?|głębsze|3
Jaki przedmiot w domu ma dla was wspólną historię?|wspomnienia|1
Która decyzja wymagała od was największego zaufania?|głębsze|3
Jakie wspomnienie opowiedziałbyś lub opowiedziałabyś komuś jako pierwsze, opisując waszą relację?|wspomnienia|2
`);

const tellCards=promptCards('tell',`
Czego ostatnio najbardziej potrzebujesz ode mnie?|relacja|2
Co sprawia, że czujesz się naprawdę kochany lub kochana?|romantyczne|2
Jak wyglądałby nasz idealny zwykły dzień?|codzienność|1
Czego chciałbyś lub chciałabyś spróbować razem w tym roku?|przyszłość|1
Co we mnie najbardziej cię uspokaja?|relacja|2
Jaki temat odkładamy, a warto o nim spokojnie porozmawiać?|głębsze|3
Co chciałbyś lub chciałabyś, żebym częściej zauważał lub zauważała?|relacja|2
W jakiej sytuacji najbardziej potrzebujesz wsparcia zamiast rozwiązania?|głębsze|3
Co oznacza dla ciebie „dobry związek” w codziennym życiu?|głębsze|3
Jak możemy lepiej odpoczywać razem?|codzienność|2
Jaki wspólny cel dałby ci najwięcej energii?|przyszłość|2
Co mogę zrobić, gdy widzę, że masz gorszy dzień?|relacja|2
Który sposób okazywania uczuć działa na ciebie najmocniej?|romantyczne|2
Jakiej wspólnej tradycji jeszcze nam brakuje?|przyszłość|1
Czego nauczyła cię nasza relacja o tobie samym lub samej?|głębsze|3
Jak rozumiesz sprawiedliwy podział obowiązków?|codzienność|2
O jakim miejscu marzysz, żeby pojechać tam razem?|podróże|1
Której swojej granicy chciałbyś lub chciałabyś lepiej pilnować?|głębsze|3
Co daje ci największe poczucie bezpieczeństwa?|relacja|3
Jak wyobrażasz sobie nas za pięć lat, bez presji na idealny plan?|przyszłość|3
Co najczęściej błędnie interpretujemy w swoim zachowaniu?|głębsze|3
Jakie małe gesty są dla ciebie ważniejsze niż wielkie niespodzianki?|romantyczne|2
Co pomaga ci wrócić do rozmowy po konflikcie?|relacja|3
Jak możemy lepiej chronić czas tylko dla nas?|relacja|2
Jaką rzecz chciałbyś lub chciałabyś odważyć się zrobić razem?|przyszłość|2
Co ostatnio dało ci poczucie dumy z siebie?|głębsze|2
Który aspekt wspólnej codzienności działa naprawdę dobrze?|codzienność|1
W czym czujesz, że najlepiej się uzupełniamy?|relacja|2
Czego nie chcesz poświęcać nawet dla ważnego wspólnego celu?|głębsze|3
Jak wygląda dla ciebie idealne przepraszanie?|relacja|3
Co pomaga ci mówić szczerze o trudnych rzeczach?|głębsze|3
Jakie wspólne doświadczenie najbardziej chciałbyś lub chciałabyś sobie podarować?|romantyczne|2
Jak możemy lepiej świętować małe sukcesy?|codzienność|1
Jaka rzecz z przyszłości ekscytuje cię, a jaka trochę przeraża?|przyszłość|3
W jakich sytuacjach najbardziej cenisz moją obecność?|relacja|2
Co jest dla ciebie ważniejsze: wspólny plan czy przestrzeń na spontaniczność?|przyszłość|2
Jak rozumiesz lojalność w związku?|głębsze|3
Który wspólny nawyk warto wprowadzić od przyszłego tygodnia?|codzienność|1
Co chciałbyś lub chciałabyś częściej robić tylko dla przyjemności?|codzienność|1
Jak możemy lepiej rozmawiać o pieniądzach?|przyszłość|3
Co w naszym sposobie podróżowania najbardziej ci odpowiada?|podróże|1
Jaki rodzaj odpoczynku daje ci najwięcej energii?|codzienność|1
Co oznacza dla ciebie „mieć własną przestrzeń” w relacji?|głębsze|3
W czym chciałbyś lub chciałabyś dostać ode mnie więcej zaufania?|relacja|3
Który komplement chciałbyś lub chciałabyś słyszeć częściej?|romantyczne|2
Jaką decyzję wolisz podejmować wspólnie, a jaką samodzielnie?|przyszłość|2
Co jest dla ciebie sygnałem, że naprawdę cię słucham?|relacja|2
Jakie ryzyko warto byłoby wspólnie podjąć?|przyszłość|3
Jak możemy sprawić, żeby zwykłe dni były trochę lepsze?|codzienność|1
Czego boisz się w trudnych rozmowach?|głębsze|3
Co chciałbyś lub chciałabyś zachować w naszej relacji niezależnie od zmian?|relacja|3
Jakiej formy czułości najbardziej potrzebujesz w stresie?|romantyczne|2
Co oznacza dla ciebie wspólny sukces?|przyszłość|2
Jak możemy lepiej zauważać swoje starania?|relacja|2
Jakie pytanie chciałbyś lub chciałabyś mi zadać, ale zwykle nie ma na nie czasu?|głębsze|3
`);

const challengeCards=promptCards('challenge',`
Powiedzcie sobie po trzy rzeczy, które ostatnio w sobie doceniliście.|romantyczne|1
Zaplanujcie randkę za maksymalnie 100 zł.|romantyczne|1
Wybierzcie wspólne zdjęcie i napiszcie jedno zdanie, dlaczego jest ważne.|wspomnienia|1
Przez pięć minut tańczcie do losowej piosenki.|zabawne|1
Zróbcie sobie nawzajem napój dokładnie tak, jak druga osoba lubi.|codzienność|1
Ustalcie jedną małą rzecz, którą zrobicie razem w tym tygodniu.|przyszłość|1
Odłóżcie telefony na 20 minut i pójdźcie na spacer.|relacja|1
Każda osoba wybiera jedną piosenkę, która kojarzy jej się z partnerem.|romantyczne|1
Przygotujcie wspólnie deser z tego, co macie w domu.|jedzenie|1
Napiszcie po jednym krótkim liście do siebie i przeczytajcie je na głos.|romantyczne|2
Przez dwie minuty patrzcie sobie w oczy bez rozmawiania.|romantyczne|2
Zróbcie listę pięciu miejsc, które chcecie razem odwiedzić.|podróże|1
Zamieńcie się obowiązkami, których zwykle nie wykonujecie.|codzienność|1
Wymyślcie nazwę dla waszego hipotetycznego wspólnego biznesu.|zabawne|1
Zróbcie sobie zdjęcie odtwarzające jedno ze starszych wspólnych zdjęć.|wspomnienia|1
Każda osoba wybiera jedną rzecz, którą druga zrobiła dobrze w tym tygodniu.|relacja|1
Zaplanujcie śniadanie, którego jeszcze nigdy razem nie przygotowywaliście.|jedzenie|1
Wybierzcie losowe miejsce w promieniu 20 km i zaplanujcie krótki wypad.|podróże|1
Przez dziesięć minut rozmawiajcie bez używania telefonów i telewizora.|relacja|1
Stwórzcie wspólną playlistę z dziesięcioma piosenkami.|zabawne|1
Każda osoba opowiada o jednym marzeniu z dzieciństwa.|wspomnienia|2
Wymyślcie własny rytuał na zakończenie trudnego dnia.|relacja|2
Zróbcie wspólnie jedną rzecz, którą odkładacie od co najmniej tygodnia.|codzienność|1
Zaplanujcie jednodniową wycieczkę bez sprawdzania mediów społecznościowych.|podróże|1
Każda osoba wymyśla jedno zabawne hasło opisujące waszą relację.|zabawne|1
Przygotujcie kolację z maksymalnie pięciu składników.|jedzenie|1
Wybierzcie jeden wspólny cel na najbliższy miesiąc i zapiszcie pierwszy krok.|przyszłość|2
Zadzwońcie do kogoś bliskiego, z kim dawno nie rozmawialiście.|relacja|1
Przez pięć minut wspominajcie tylko zabawne sytuacje z wyjazdów.|podróże|1
Zróbcie listę rzeczy, które chcielibyście zrobić pierwszy raz razem.|przyszłość|2
Każda osoba przygotowuje drugiej małą niespodziankę bez wydawania pieniędzy.|romantyczne|1
Wymyślcie idealny weekend, ale każde z was może wybrać tylko jedną atrakcję.|podróże|1
Przejrzyjcie wspólne zdjęcia z jednego miesiąca lub wyjazdu.|wspomnienia|1
Zagrajcie w kamień, papier, nożyce. Przegrany robi wybrany napój.|zabawne|1
Każda osoba mówi jedną rzecz, za którą jest dziś wdzięczna.|głębsze|2
Zaplanujcie wieczór tematyczny inspirowany wybranym krajem.|jedzenie|1
Wybierzcie jedną rzecz, którą przez tydzień będziecie robić bardziej świadomie.|codzienność|2
Stwórzcie wspólną listę „kiedyś zrobimy” i wybierzcie jedną realną rzecz.|przyszłość|2
Przez trzy minuty każda osoba opowiada, co ostatnio zaprząta jej głowę.|głębsze|2
Zróbcie dziesięciominutowy masaż na zmianę.|romantyczne|1
Wymyślcie własne święto pary i jego jedną tradycję.|zabawne|1
Zaplanujcie dzień bez wydawania pieniędzy poza koniecznymi wydatkami.|codzienność|1
Każda osoba wybiera jedną rzecz, której chciałaby nauczyć partnera.|relacja|1
Zróbcie wspólnie krótką listę rzeczy do spakowania na wymarzony wyjazd.|podróże|1
Ułóżcie pięć pytań, które chcielibyście sobie zadać za rok.|przyszłość|3
Każda osoba opisuje idealny poranek w trzech zdaniach.|codzienność|1
Przygotujcie przekąskę i obejrzyjcie pierwszy odcinek serialu wybranego losowo.|zabawne|1
Wybierzcie jedną wspólną przestrzeń i uporządkujcie ją przez dziesięć minut.|codzienność|1
Nagrajcie krótką wiadomość głosową do was z przyszłości.|przyszłość|2
Zróbcie jedno zdjęcie, które ma symbolizować dzisiejszy dzień.|wspomnienia|1
`);

const LIBRARY=[...waveCards,...knowCards,...whoCards,...dilemmaCards,...scaleCardsData,...planCardsData,...wordBoards,...storyCards,...tellCards,...challengeCards];
const LIBRARY_BY_ID=new Map(LIBRARY.map(card=>[card.id,card]));

function safeParse(value,fallback){try{return value?JSON.parse(value):fallback}catch{return fallback}}
const defaultSettings={names:['Gracz 1','Gracz 2'],rounds:10,points:true,intensity:2,relation:'long',categories:[...CATEGORIES],mixPreset:'quick',sound:false};
const defaultProfile={seen:[],favorites:[],hiddenCategories:[],custom:[],sessions:[],dailyDone:{}};
let settings={...defaultSettings,...safeParse(localStorage.getItem(STORAGE.settings),{})};
if(!Array.isArray(settings.names)||settings.names.length!==2)settings.names=[...defaultSettings.names];
if(!Array.isArray(settings.categories))settings.categories=[...CATEGORIES];
let profile={...defaultProfile,...safeParse(localStorage.getItem(STORAGE.profile),{})};
for(const key of ['seen','favorites','hiddenCategories','custom','sessions'])if(!Array.isArray(profile[key]))profile[key]=[];
if(!profile.dailyDone||typeof profile.dailyDone!=='object')profile.dailyDone={};
let currentSession=safeParse(localStorage.getItem(STORAGE.session),null);
let ui={view:'home',selectedMode:'wave',setupMode:'wave',modal:null,notice:'',installPrompt:null};
let timerHandle=null;

function saveSettings(){localStorage.setItem(STORAGE.settings,JSON.stringify(settings))}
function saveProfile(){localStorage.setItem(STORAGE.profile,JSON.stringify(profile))}
function saveSession(){if(currentSession)localStorage.setItem(STORAGE.session,JSON.stringify(currentSession));else localStorage.removeItem(STORAGE.session)}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function unique(items){return [...new Set(items)]}
function modeMeta(id){return MODES[id]||{id:'mix',icon:'✦',title:'Miks gier',tagline:'Różne mechaniki w jednej sesji.',description:'Własna sesja z wybranych trybów.',duration:'10–35 min',difficulty:'Dowolna',instructions:['Wybierz nastrój, długość i kategorie.','Każda runda może korzystać z innej mechaniki.','Role zmieniają się automatycznie.'],scoring:'Punktacja zależy od typu karty.'}}
function getAllCards(){return [...LIBRARY,...profile.custom.map((card,index)=>({...card,id:card.id||`custom-${index+1}`,mode:'custom',type:'conversation'}))]}
function findCard(id){return getAllCards().find(card=>card.id===id)||LIBRARY_BY_ID.get(id)}
function cardPrompt(card){if(!card)return'';if(card.type==='plan')return `${card.title}: ${card.twist}`;return card.prompt}
function currentCard(){return currentSession?.deck?.[currentSession.index]||null}
function activeMode(){return currentCard()?.mode||currentSession?.mode||ui.selectedMode}
function roleIndexes(){const first=currentSession.index%2;return[first,first===0?1:0]}
function playerName(index){return escapeHtml(currentSession?.names?.[index]||settings.names[index]||`Gracz ${index+1}`)}
function formatDate(timestamp){return new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(timestamp))}
function todayKey(){return new Date().toISOString().slice(0,10)}
function dayIndex(){const start=new Date(new Date().getFullYear(),0,0);return Math.floor((Date.now()-start)/(86400000))}
function vibrate(pattern=25){if(navigator.vibrate)navigator.vibrate(pattern)}
function toast(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(toastEl._timer);toastEl._timer=setTimeout(()=>toastEl.classList.remove('show'),2200)}
function burst(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;confettiEl.innerHTML='';const colors=['#d946ef','#8b5cf6','#62d9a4','#ffca75','#fff'];for(let i=0;i<34;i++){const piece=document.createElement('i');piece.style.left=`${Math.random()*100}%`;piece.style.background=colors[i%colors.length];piece.style.animationDelay=`${Math.random()*.28}s`;piece.style.transform=`rotate(${Math.random()*180}deg)`;confettiEl.appendChild(piece)}setTimeout(()=>confettiEl.innerHTML='',1900)}
function announce(message){ui.notice=message;render()}

function eligibleCards(mode,options={}){
  const intensity=options.intensity||settings.intensity||2;
  const categories=options.categories?.length?options.categories:settings.categories;
  const modes=mode==='mix'?(options.modes?.length?options.modes:MODE_ORDER):[mode];
  const hidden=new Set(profile.hiddenCategories);
  const maxLevel=settings.relation==='new'?Math.min(intensity,2):intensity;return getAllCards().filter(card=>modes.includes(card.mode)||(mode==='mix'&&card.mode==='custom')).filter(card=>card.level<=maxLevel).filter(card=>categories.includes(card.category)).filter(card=>!hidden.has(card.category));
}
function buildDeck(mode,count,options={}){
  let pool=eligibleCards(mode,options);
  if(!pool.length)pool=eligibleCards(mode,{...options,categories:CATEGORIES,intensity:3});
  const seen=new Set(profile.seen);
  const fresh=shuffle(pool.filter(card=>!seen.has(card.id)));
  const old=shuffle(pool.filter(card=>seen.has(card.id)));
  const chosen=[];
  for(const card of [...fresh,...old]){if(chosen.length>=count)break;if(!chosen.some(item=>item.id===card.id))chosen.push(card)}
  if(chosen.length<count&&pool.length){while(chosen.length<count)chosen.push(pool[chosen.length%pool.length])}
  return chosen.slice(0,count).map(card=>({...card}));
}
function presetOptions(presetId){const preset=MIX_PRESETS[presetId]||MIX_PRESETS.quick;return{modes:preset.modes,categories:preset.categories,intensity:preset.intensity}}

function render(){clearInterval(timerHandle);timerHandle=null;document.title=ui.view==='home'?'Między Nami — gry dla par':`${modeMeta(activeMode()).title} — Między Nami`;if(ui.view==='home')renderHome();else if(ui.view==='info')renderInfo();else if(ui.view==='setup')renderSetup();else if(ui.view==='play')renderPlay();else if(ui.view==='summary')renderSummary();else if(ui.view==='stats')renderStats();else if(ui.view==='favorites')renderFavorites();else if(ui.view==='custom')renderCustom();else if(ui.view==='settings')renderSettings();renderModal();window.scrollTo({top:0,behavior:'smooth'})}

function renderHome(){
  const stats=calculateStats();
  const daily=dailyCard();
  app.innerHTML=`
    <section class="hero">
      <span class="eyebrow">${getAllCards().length}+ KART • 10 GIER • OFFLINE</span>
      <h1>Jeden telefon. Dwie osoby. <span class="gradient-text">Dużo do odkrycia.</span></h1>
      <p>Zabawne zgadywanie, wspomnienia, dylematy i rozmowy. Gra zapamiętuje wykorzystane karty, działa bez konta i może działać bez internetu.</p>
    </section>
    ${currentSession?`<div class="resume-banner"><div><strong>Niedokończona sesja</strong><p>${escapeHtml(modeMeta(currentSession.mode).title)} • runda ${currentSession.index+1}/${currentSession.deck.length}</p></div><button class="button good small-button" onclick="resumeSession()">Kontynuuj</button></div>`:''}
    <section class="quick-actions">
      <button class="quick-card" onclick="startQuick('quick')"><span class="quick-icon">⚡</span><strong>Zagraj teraz</strong><span>10 losowych kart bez konfiguracji. Najszybszy sposób na rozpoczęcie.</span></button>
      <button class="quick-card secondary" onclick="openMixSetup()"><span class="quick-icon">✦</span><strong>Stwórz własną sesję</strong><span>Wybierz nastrój, kategorie, poziom i czas.</span></button>
    </section>
    <section class="daily-card">
      <span class="small">KARTA DNIA • ${escapeHtml(CATEGORY_LABELS[daily.category])}</span>
      <h3>${escapeHtml(cardPrompt(daily))}</h3>
      <p>Jedno pytanie dziennie, bez uruchamiania całej sesji.</p>
      <div class="button-row"><button class="button secondary small-button" onclick="markDaily()">${profile.dailyDone[todayKey()]?'Ukończone ✓':'Rozmawiamy'}</button><button class="button tertiary small-button" onclick="toggleFavorite('${daily.id}')">${profile.favorites.includes(daily.id)?'♥ Zapisane':'♡ Zapisz'}</button></div>
    </section>
    <div class="section-head"><div><h2>Wybierz grę</h2><p>Każdy tryb ma inną mechanikę i automatyczną zmianę ról.</p></div><button class="section-link" onclick="showStats()">${stats.sessions} sesji →</button></div>
    <section class="game-grid">${MODE_ORDER.map((id,index)=>gameCard(MODES[id],index)).join('')}</section>`;
}
function gameCard(game,index){const count=getAllCards().filter(card=>card.mode===game.id).length;return`<button class="game-card" onclick="openGameInfo('${game.id}')"><span class="game-badge">${count} kart</span><span class="game-icon">${game.icon}</span><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.tagline)}</p><span class="game-meta"><span>${String(index+1).padStart(2,'0')}</span><span>Zobacz zasady →</span></span></button>`}

function renderInfo(){const game=modeMeta(ui.selectedMode);const count=getAllCards().filter(card=>card.mode===game.id).length;app.innerHTML=`<section class="panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">${game.icon} ${count} kart</span></div><h1>${escapeHtml(game.title)}</h1><p class="muted">${escapeHtml(game.description)}</p><div class="info-grid"><div class="info-box"><span>Czas</span><strong>${escapeHtml(game.duration)}</strong></div><div class="info-box"><span>Poziom</span><strong>${escapeHtml(game.difficulty)}</strong></div><div class="info-box"><span>Urządzenia</span><strong>1 telefon</strong></div></div><h3>Jak gracie</h3><ol class="rules">${game.instructions.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ol><div class="scoring"><strong>Punktacja:</strong> ${escapeHtml(game.scoring)}</div><div class="button-row"><button class="button primary full" onclick="openSetup('${game.id}')">Ustaw grę</button></div></section>`}

function renderSetup(){
  const isMix=ui.setupMode==='mix';const game=modeMeta(ui.setupMode);
  app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="${isMix?'goHome()':`openGameInfo('${ui.setupMode}')`}">← Wróć</button><span class="chip">${isMix?'✦ Miks':game.icon+' '+escapeHtml(game.title)}</span></div><h1>${isMix?'Własna sesja':escapeHtml(game.title)}</h1><p class="muted">${isMix?'Połącz kilka mechanik i dopasuj wieczór do waszego nastroju.':'Ustawcie imiona, długość i poziom rozmowy.'}</p>
  ${isMix?`<h3>Nastrój</h3><div class="chips">${Object.entries(MIX_PRESETS).map(([id,preset])=>`<button class="chip ${settings.mixPreset===id?'active':''}" onclick="selectPreset('${id}')">${preset.icon} ${escapeHtml(preset.title)}</button>`).join('')}</div><p class="small">${escapeHtml((MIX_PRESETS[settings.mixPreset]||MIX_PRESETS.quick).description)}</p>`:''}
  <div class="form-grid"><label class="field"><span>Imię osoby 1</span><input class="input" id="name-a" value="${escapeHtml(settings.names[0])}" maxlength="24"></label><label class="field"><span>Imię osoby 2</span><input class="input" id="name-b" value="${escapeHtml(settings.names[1])}" maxlength="24"></label><label class="field"><span>Liczba rund</span><select class="select" id="round-count">${[5,10,15,20,30].map(value=>`<option ${settings.rounds===value?'selected':''}>${value}</option>`).join('')}</select></label><label class="field"><span>Etap relacji</span><select class="select" id="relation"><option value="new" ${settings.relation==='new'?'selected':''}>Nowa para / pierwsze randki</option><option value="long" ${settings.relation==='long'?'selected':''}>Jesteśmy razem dłużej</option><option value="married" ${settings.relation==='married'?'selected':''}>Małżeństwo / wspólne życie</option><option value="distance" ${settings.relation==='distance'?'selected':''}>Związek na odległość</option></select></label></div>
  <h3>Poziom rozmowy</h3><div class="chips">${[[1,'Lekki'],[2,'Normalny'],[3,'Bez ograniczeń']].map(([value,label])=>`<button class="chip ${settings.intensity===value?'active':''}" onclick="setIntensity(${value})">${label}</button>`).join('')}</div>
  <h3>Kategorie</h3><div class="checkbox-grid">${CATEGORIES.map(category=>`<label class="check-option"><input type="checkbox" data-category="${category}" ${settings.categories.includes(category)?'checked':''}>${CATEGORY_LABELS[category]}</label>`).join('')}</div>
  <div class="toggle-row"><div><strong>Punktacja</strong><div class="small">Możecie grać wyłącznie dla rozmowy.</div></div><button class="toggle ${settings.points?'on':''}" aria-pressed="${settings.points}" onclick="togglePoints()"></button></div>
  <div class="button-row"><button class="button primary full" onclick="startConfiguredSession()">Zaczynamy</button></div></section>`;
}

function renderPlay(){
  if(!currentSession||!currentCard()){goHome();return}
  const card=currentCard(),mode=modeMeta(card.mode);const progress=((currentSession.index+1)/currentSession.deck.length)*100;const[firstIndex,secondIndex]=roleIndexes();
  let content='';
  if(card.type==='choice'||card.type==='plan')content=renderChoiceCard(card,firstIndex,secondIndex);
  else if(card.type==='scale')content=renderScaleCard(card,firstIndex,secondIndex);
  else if(card.type==='words')content=renderWordCard(card,firstIndex,secondIndex);
  else if(card.type==='challenge')content=renderChallengeCard(card);
  else content=renderConversationCard(card);
  app.innerHTML=`<section class="panel"><div class="session-head"><span class="round-label">${currentSession.index+1}/${currentSession.deck.length}</span><div class="progress-track" aria-label="Postęp gry"><div class="progress-fill" style="width:${progress}%"></div></div><button class="session-menu" onclick="openSessionMenu()" aria-label="Menu sesji">•••</button></div><div class="score-strip">${currentSession.points?`<span class="score-pill">${playerName(0)}: ${currentSession.scores[0]}</span><span class="score-pill">Wspólne: ${currentSession.shared}</span><span class="score-pill">${playerName(1)}: ${currentSession.scores[1]}</span>`:`<span class="score-pill">Tryb bez punktów</span>`}<span class="score-pill">${mode.icon} ${escapeHtml(mode.title)}</span></div>${ui.notice?`<div class="notice">${escapeHtml(ui.notice)}</div>`:''}${content}<div class="card-tools"><button class="text-button ${profile.favorites.includes(card.id)?'favorite':''}" onclick="toggleFavorite('${card.id}')">${profile.favorites.includes(card.id)?'♥ Zapisano':'♡ Ulubione'}</button><button class="text-button" onclick="skipCard()">Pomiń kartę →</button></div></section>`;
  if(card.type==='challenge'&&currentSession.timer?.running)startTimerLoop();
}

function renderChoiceCard(card,firstIndex,secondIndex){
  const options=card.type==='plan'?['Bierzemy','Odpuszczamy']:card.mode==='who'?[currentSession.names[0],currentSession.names[1],'Oboje']:card.options;
  const question=card.type==='plan'?`${card.title}`:card.prompt;
  if(currentSession.phase==='first')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(firstIndex)}, ${card.mode==='know'?'wybierz prawdziwą odpowiedź':'wybierz swoją odpowiedź'}</p><h2 class="prompt">${escapeHtml(question)}</h2>${card.type==='plan'?`<div class="secret-box"><strong>Oferta:</strong><p>✓ ${escapeHtml(card.positives[0])}<br>✓ ${escapeHtml(card.positives[1])}</p><strong>Haczyk:</strong><p>${escapeHtml(card.twist)}</p></div>`:''}${answerButtons(options,'chooseFirstAnswer')}`;
  if(currentSession.phase==='handoff')return renderHandoff(secondIndex,card.mode==='know'?'Spróbuj przewidzieć odpowiedź partnera.':'Odpowiedz bez podglądania pierwszego wyboru.');
  if(currentSession.phase==='second')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(secondIndex)}, ${card.mode==='know'?`co wybrał lub wybrała ${playerName(firstIndex)}?`:'wybierz swoją odpowiedź'}</p><h2 class="prompt">${escapeHtml(question)}</h2>${card.type==='plan'?`<div class="secret-box"><strong>Oferta:</strong><p>✓ ${escapeHtml(card.positives[0])}<br>✓ ${escapeHtml(card.positives[1])}</p><strong>Haczyk:</strong><p>${escapeHtml(card.twist)}</p></div>`:''}${answerButtons(options,'chooseSecondAnswer')}`;
  const same=currentSession.firstAnswer===currentSession.secondAnswer;const result=currentSession.roundResult||{};return`<div class="${same?'result-success':'result-different'}"><div class="result-title">${same?'Zgodność!':'Różne odpowiedzi'}</div></div><div class="result-box"><div class="result-answers"><div class="result-answer"><span>${playerName(firstIndex)}</span><strong>${escapeHtml(options[currentSession.firstAnswer])}</strong></div><div class="result-answer"><span>${playerName(secondIndex)}</span><strong>${escapeHtml(options[currentSession.secondAnswer])}</strong></div></div><p class="point-line">${escapeHtml(result.message||'Porozmawiajcie, skąd wzięły się te odpowiedzi.')}</p></div>${nextButton(same)}`;
}
function answerButtons(options,handler){const long=options.some(option=>String(option).length>28);return`<div class="answer-grid ${long?'long':''}">${options.map((option,index)=>`<button class="answer" onclick="${handler}(${index})">${escapeHtml(option)}</button>`).join('')}</div>`}
function renderHandoff(nextIndex,text){return`<div class="handoff"><div class="handoff-icon">📱</div><h2>Przekaż telefon</h2><p class="muted">Teraz odpowiada <strong>${playerName(nextIndex)}</strong>. ${escapeHtml(text)}</p><button class="button primary" onclick="acceptHandoff()">Mam telefon</button></div>`}

function renderScaleCard(card,firstIndex,secondIndex){
  if(currentSession.phase==='first')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(firstIndex)}, nie pokazuj liczby</p><h2 class="prompt">${escapeHtml(card.prompt)}</h2><div class="secret-box"><div class="small" style="text-align:center">Tajna wartość</div><div class="secret-number">${currentSession.secret}</div><div class="scale-ends"><span>${escapeHtml(card.low)}</span><span>${escapeHtml(card.high)}</span></div></div><label class="field"><span>${card.mode==='wave'?'Wpisz przykład pasujący do skali':'Wpisz odpowiedź o tej intensywności'}</span><textarea class="textarea" id="clue-input" placeholder="Partner zobaczy tylko tę odpowiedź">${escapeHtml(currentSession.clue||'')}</textarea></label><button class="button primary" onclick="submitClue()">Przekaż telefon</button>`;
  if(currentSession.phase==='handoff')return renderHandoff(secondIndex,'Zobaczysz podpowiedź, ale nie tajną liczbę.');
  if(currentSession.phase==='second')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(secondIndex)}, odgadnij tajną wartość</p><h2 class="prompt">${escapeHtml(card.prompt)}</h2><div class="result-box"><span class="small">Odpowiedź partnera</span><p>${escapeHtml(currentSession.clue)}</p></div><input class="range" id="guess-range" type="range" min="1" max="10" value="${currentSession.guess||5}" oninput="document.querySelector('#range-value').textContent=this.value"><div class="range-value" id="range-value">${currentSession.guess||5}</div><div class="scale-ends"><span>${escapeHtml(card.low)}</span><span>${escapeHtml(card.high)}</span></div><div class="button-row"><button class="button primary full" onclick="revealScaleAnswer()">Odkryj wynik</button></div>`;
  const diff=Math.abs(currentSession.secret-currentSession.secondAnswer),result=currentSession.roundResult||{};const title=diff===0?'Idealne trafienie!':diff<=2?'Bardzo blisko':'Inne rozumienie skali';return`<div class="${diff===0?'result-success':diff<=2?'result-near':'result-different'}"><div class="result-title">${title}</div></div><div class="result-box"><div class="result-answers"><div class="result-answer"><span>Tajna liczba</span><strong>${currentSession.secret}</strong></div><div class="result-answer"><span>Odpowiedź ${playerName(secondIndex)}</span><strong>${currentSession.secondAnswer}</strong></div></div><p class="point-line">${escapeHtml(result.message||'Porównajcie, dlaczego inaczej oceniliście odpowiedź.')}</p></div>${nextButton(diff===0)}`;
}

function renderWordCard(card,firstIndex,secondIndex){
  if(currentSession.phase==='first')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(firstIndex)}, wybierz dokładnie 3 tajne słowa</p><h2 class="prompt">${escapeHtml(card.prompt)}</h2>${wordGrid(card.words,currentSession.firstAnswer||[],'toggleFirstWord')}<label class="field"><span>Jednowyrazowa podpowiedź</span><input class="input" id="word-clue" value="${escapeHtml(currentSession.clue||'')}" placeholder="np. wakacje"></label><button class="button primary" onclick="submitWords()">Przekaż telefon</button>`;
  if(currentSession.phase==='handoff')return renderHandoff(secondIndex,'Wybierz trzy słowa na podstawie jednej podpowiedzi.');
  if(currentSession.phase==='second')return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><p class="role-label">${playerName(secondIndex)}, wybierz dokładnie 3 słowa</p><div class="result-box"><span class="small">Podpowiedź</span><p><strong>${escapeHtml(currentSession.clue)}</strong></p></div>${wordGrid(card.words,currentSession.secondAnswer||[],'toggleSecondWord')}<div class="button-row"><button class="button primary full" onclick="revealWords()">Odkryj słowa</button></div>`;
  const hits=(currentSession.secondAnswer||[]).filter(word=>(currentSession.firstAnswer||[]).includes(word)).length;return`<div class="${hits===3?'result-success':hits?'result-near':'result-different'}"><div class="result-title">${hits===3?'Komplet!':`${hits}/3 trafień`}</div></div><div class="result-box"><div class="result-answer"><span>Tajne słowa</span><strong>${escapeHtml((currentSession.firstAnswer||[]).join(', '))}</strong></div><div class="result-answer"><span>Wybrane słowa</span><strong>${escapeHtml((currentSession.secondAnswer||[]).join(', '))}</strong></div><p class="point-line">${escapeHtml(currentSession.roundResult?.message||'')}</p></div>${nextButton(hits===3)}`;
}
function wordGrid(words,selected,handler){return`<div class="word-grid">${words.map((word,index)=>`<button class="word ${selected.includes(word)?'selected':''}" onclick="${handler}(${index})">${escapeHtml(word)}</button>`).join('')}</div>`}

function renderConversationCard(card){return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><h2 class="prompt">${escapeHtml(card.prompt)}</h2><p class="muted">Odpowiedzcie kolejno. Możecie dopytywać i zatrzymać się przy tej karcie tak długo, jak potrzebujecie.</p><div class="button-row"><button class="button primary" onclick="completeConversation()">Porozmawialiśmy</button><button class="button secondary" onclick="skipCard()">Pomiń</button></div>`}
function renderChallengeCard(card){const timer=currentSession.timer||{remaining:0,running:false};return`<span class="card-category">${CATEGORY_LABELS[card.category]}</span><h2 class="prompt">${escapeHtml(card.prompt)}</h2><p class="muted">Zróbcie to teraz albo zapiszcie kartę w ulubionych na później.</p><div class="timer-box"><div class="timer-value" id="timer-value">${formatTimer(timer.remaining)}</div><div class="timer-presets"><button class="button tertiary small-button" onclick="setTimer(60)">1 min</button><button class="button tertiary small-button" onclick="setTimer(300)">5 min</button><button class="button tertiary small-button" onclick="setTimer(600)">10 min</button><button class="button secondary small-button" onclick="toggleTimer()">${timer.running?'Pauza':'Start'}</button></div></div><div class="button-row"><button class="button primary" onclick="completeChallenge()">Wykonane ✓</button><button class="button secondary" onclick="skipCard()">Pomiń</button></div>`}
function nextButton(success){return`<div class="button-row"><button class="button primary full" onclick="nextRound()">Następna karta</button></div>${success?'<span class="small">Idealna zgodność została dodana do wspólnego wyniku.</span>':''}`}

function renderSummary(){if(!currentSession){goHome();return}finalizeSession();const total=currentSession.results.length;const comparable=currentSession.results.filter(result=>result.comparable);const matches=comparable.filter(result=>result.match).length;const percent=comparable.length?Math.round(matches/comparable.length*100):0;const topCategory=topValue(currentSession.results.map(result=>result.category));app.innerHTML=`<section class="panel"><div class="summary-hero"><span class="eyebrow">KONIEC SESJI</span><h1>Dobra robota <span class="gradient-text">♡</span></h1><p class="muted">Rozegraliście ${total} kart. Najważniejsze odpowiedzi dopiero zaczynają rozmowę.</p></div>${currentSession.points?`<div class="summary-score"><div class="summary-stat"><span>${playerName(0)}</span><strong>${currentSession.scores[0]}</strong></div><div class="summary-stat"><span>Wspólne</span><strong>${currentSession.shared}</strong></div><div class="summary-stat"><span>${playerName(1)}</span><strong>${currentSession.scores[1]}</strong></div></div>`:''}${comparable.length?`<div class="insight"><strong>Zgodność odpowiedzi: ${percent}%</strong><p class="muted">${matches} zgodnych wyników na ${comparable.length} porównanych odpowiedzi.</p></div>`:`<div class="insight"><strong>${total} ukończonych rozmów i wyzwań</strong><p class="muted">W tej sesji nie było kart z porównywaniem odpowiedzi.</p></div>`}${topCategory?`<div class="insight"><strong>Najczęstsza kategoria: ${CATEGORY_LABELS[topCategory]}</strong><p class="muted">W tej sesji najwięcej kart dotyczyło właśnie tego obszaru.</p></div>`:''}<div class="button-row"><button class="button primary" onclick="replaySession()">Zagraj ponownie</button><button class="button secondary" onclick="finishToHome()">Wybierz inną grę</button></div></section>`}

function renderStats(){const stats=calculateStats();app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">Historia lokalna</span></div><h1>Wasze statystyki</h1><p class="muted">Dane są zapisane tylko na tym urządzeniu. Nie są wysyłane na serwer.</p><div class="dashboard-grid"><div class="dashboard-card"><strong>${stats.sessions}</strong><span>rozegranych sesji</span></div><div class="dashboard-card"><strong>${stats.rounds}</strong><span>ukończonych kart</span></div><div class="dashboard-card"><strong>${stats.shared}</strong><span>punktów wspólnych</span></div></div>${stats.sessions?`<div class="insight"><strong>Najczęściej wybieracie: ${escapeHtml(modeMeta(stats.favoriteMode).title)}</strong><p class="muted">Średnia zgodność: ${stats.matchRate}%.</p></div><h3>Ostatnie sesje</h3><div class="list">${profile.sessions.slice(-10).reverse().map(session=>`<div class="list-item"><div><strong>${escapeHtml(modeMeta(session.mode).title)}</strong><p>${formatDate(session.finishedAt)} • ${session.rounds} kart • ${session.matchRate}% zgodności</p></div><span class="chip">${session.shared} wsp.</span></div>`).join('')}</div>`:`<div class="empty">Zagraj pierwszą sesję, a tutaj pojawią się statystyki.</div>`}<div class="button-row"><button class="button danger" onclick="confirmResetHistory()">Wyczyść historię</button></div></section>`}

function renderFavorites(){const cards=profile.favorites.map(findCard).filter(Boolean);app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">${cards.length} kart</span></div><h1>Ulubione</h1><p class="muted">Zapisane pytania, scenariusze i wyzwania dostępne na tym urządzeniu.</p>${cards.length?`<div class="list">${cards.map(card=>`<div class="list-item"><div><span class="small">${escapeHtml(modeMeta(card.mode).title)} • ${CATEGORY_LABELS[card.category]}</span><strong style="display:block;margin-top:5px">${escapeHtml(cardPrompt(card))}</strong></div><button class="button tertiary small-button" onclick="toggleFavorite('${card.id}')">Usuń</button></div>`).join('')}</div>`:`<div class="empty">Kliknij ♡ przy dowolnej karcie, aby zapisać ją na później.</div>`}</section>`}

function renderCustom(){app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">${profile.custom.length} własnych</span></div><h1>Własne karty</h1><p class="muted">Dodaj pytania związane z waszymi wspomnieniami, planami lub żartami. Pojawią się w miksach.</p><label class="field"><span>Treść karty</span><textarea class="textarea" id="custom-prompt" maxlength="280" placeholder="Np. Który nasz wyjazd wspominamy najlepiej i dlaczego?"></textarea></label><div class="form-grid"><label class="field"><span>Kategoria</span><select class="select" id="custom-category">${CATEGORIES.map(category=>`<option value="${category}">${CATEGORY_LABELS[category]}</option>`).join('')}</select></label><label class="field"><span>Poziom</span><select class="select" id="custom-level"><option value="1">Lekki</option><option value="2">Normalny</option><option value="3">Głębszy</option></select></label></div><div class="button-row"><button class="button primary" onclick="addCustomCard()">Dodaj kartę</button></div><h3>Dodane karty</h3>${profile.custom.length?`<div class="list">${profile.custom.map(card=>`<div class="list-item"><div><span class="small">${CATEGORY_LABELS[card.category]}</span><strong style="display:block;margin-top:5px">${escapeHtml(card.prompt)}</strong></div><button class="button danger small-button" onclick="deleteCustomCard('${card.id}')">Usuń</button></div>`).join('')}</div>`:`<div class="empty">Nie dodano jeszcze żadnej własnej karty.</div>`}</section>`}

function renderSettings(){app.innerHTML=`<section class="panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">Ustawienia lokalne</span></div><h1>Ustawienia</h1><div class="form-grid"><label class="field"><span>Imię osoby 1</span><input class="input" id="settings-name-a" value="${escapeHtml(settings.names[0])}" maxlength="24"></label><label class="field"><span>Imię osoby 2</span><input class="input" id="settings-name-b" value="${escapeHtml(settings.names[1])}" maxlength="24"></label></div><div class="toggle-row"><div><strong>Domyślna punktacja</strong><div class="small">Można zmienić przed każdą sesją.</div></div><button class="toggle ${settings.points?'on':''}" onclick="togglePoints()"></button></div><div class="button-row"><button class="button primary" onclick="saveSettingsForm()">Zapisz ustawienia</button></div><h3>Talia i dane</h3><div class="button-row"><button class="button secondary" onclick="resetSeenCards()">Zacznij talię od nowa</button><button class="button danger" onclick="confirmResetAll()">Usuń wszystkie dane</button></div><p class="small">Wykorzystane karty: ${profile.seen.length}. Aplikacja najpierw pokazuje nowe karty, a dopiero później wraca do wcześniejszych.</p></section>`}

function renderModal(){if(!ui.modal){modalRoot.innerHTML='';return}let body='';if(ui.modal==='main-menu')body=`<button class="close" onclick="closeModal()">×</button><h2>Menu</h2><div class="menu-list"><button class="menu-item" onclick="showStats()">Statystyki<span>Historia sesji i zgodność</span></button><button class="menu-item" onclick="showFavorites()">Ulubione<span>Zapisane pytania i wyzwania</span></button><button class="menu-item" onclick="showCustom()">Własne karty<span>Dodaj prywatne pytania</span></button><button class="menu-item" onclick="showSettings()">Ustawienia<span>Imiona, talia i dane lokalne</span></button>${ui.installPrompt?`<button class="menu-item" onclick="installApp()">Zainstaluj aplikację<span>Dodaj ikonę do ekranu głównego</span></button>`:''}</div>`;else if(ui.modal==='session-menu')body=`<button class="close" onclick="closeModal()">×</button><h2>Opcje sesji</h2><div class="menu-list"><button class="menu-item" onclick="skipCard()">Pomiń kartę<span>Bez punktów i bez wyjaśnienia</span></button><button class="menu-item" onclick="hideSimilar()">Nie pokazuj podobnych<span>Ukryj kategorię ${CATEGORY_LABELS[currentCard()?.category]||''}</span></button><button class="menu-item" onclick="saveAndExit()">Zapisz i wyjdź<span>Wrócisz do tej rundy później</span></button><button class="menu-item" onclick="confirmEndSession()">Zakończ grę<span>Przejdź do podsumowania</span></button></div>`;else if(ui.modal==='confirm-end')body=`<button class="close" onclick="closeModal()">×</button><h2>Zakończyć sesję?</h2><p class="muted">Dotychczasowy wynik zostanie zapisany w historii.</p><div class="button-row"><button class="button danger" onclick="endSessionNow()">Zakończ</button><button class="button secondary" onclick="closeModal()">Graj dalej</button></div>`;else if(ui.modal==='reset-history')body=`<button class="close" onclick="closeModal()">×</button><h2>Wyczyścić historię?</h2><p class="muted">Ulubione i własne karty pozostaną.</p><div class="button-row"><button class="button danger" onclick="resetHistory()">Wyczyść</button><button class="button secondary" onclick="closeModal()">Anuluj</button></div>`;else if(ui.modal==='reset-all')body=`<button class="close" onclick="closeModal()">×</button><h2>Usunąć wszystkie dane?</h2><p class="muted">Znikną ustawienia, historia, ulubione, własne karty i niedokończona sesja.</p><div class="button-row"><button class="button danger" onclick="resetAll()">Usuń wszystko</button><button class="button secondary" onclick="closeModal()">Anuluj</button></div>`;modalRoot.innerHTML=`<div class="modal-backdrop" onclick="backdropClose(event)"><section class="modal" role="dialog" aria-modal="true">${body}</section></div>`}

function goHome(){ui.view='home';ui.notice='';closeModal(false);render()}
function openGameInfo(id){ui.selectedMode=id;ui.view='info';render()}
function openSetup(id){ui.setupMode=id;ui.view='setup';render()}
function openMixSetup(){ui.setupMode='mix';ui.view='setup';render()}
function showStats(){ui.view='stats';ui.modal=null;render()}
function showFavorites(){ui.view='favorites';ui.modal=null;render()}
function showCustom(){ui.view='custom';ui.modal=null;render()}
function showSettings(){ui.view='settings';ui.modal=null;render()}
function openSessionMenu(){ui.modal='session-menu';renderModal()}
function closeModal(rerender=false){ui.modal=null;renderModal();if(rerender)render()}
function backdropClose(event){if(event.target.classList.contains('modal-backdrop'))closeModal()}
function confirmEndSession(){ui.modal='confirm-end';renderModal()}
function confirmResetHistory(){ui.modal='reset-history';renderModal()}
function confirmResetAll(){ui.modal='reset-all';renderModal()}

function selectPreset(id){settings.mixPreset=id;const preset=MIX_PRESETS[id];settings.intensity=preset.intensity;settings.categories=[...preset.categories];saveSettings();render()}
function setIntensity(value){settings.intensity=value;saveSettings();render()}
function togglePoints(){settings.points=!settings.points;saveSettings();render()}
function collectSetup(){
  const nameA=$('#name-a')?.value.trim()||settings.names[0]||'Gracz 1';
  const nameB=$('#name-b')?.value.trim()||settings.names[1]||'Gracz 2';
  const rounds=+($('#round-count')?.value||settings.rounds||10);
  const relation=$('#relation')?.value||settings.relation;
  const checked=[...document.querySelectorAll('[data-category]:checked')].map(input=>input.dataset.category);
  settings={...settings,names:[nameA,nameB],rounds,relation,categories:checked.length?checked:[...CATEGORIES]};
  saveSettings();
}
function startConfiguredSession(){collectSetup();if(ui.setupMode==='mix'){const preset=presetOptions(settings.mixPreset);startSession('mix',settings.rounds,{...preset,categories:settings.categories,intensity:settings.intensity})}else startSession(ui.setupMode,settings.rounds,{categories:settings.categories,intensity:settings.intensity,modes:[ui.setupMode]})}
function startQuick(presetId='quick'){const preset=presetOptions(presetId);settings.mixPreset=presetId;saveSettings();startSession('mix',10,preset)}
function startSession(mode,count,options){
  const deck=buildDeck(mode,count,options);
  if(!deck.length){toast('Brak kart dla wybranych filtrów.');return}
  currentSession={version:2,mode,names:[...settings.names],deck,index:0,phase:'first',scores:[0,0],shared:0,firstAnswer:null,secondAnswer:null,secret:1+Math.floor(Math.random()*10),guess:5,clue:'',roundResult:null,results:[],points:settings.points,startedAt:Date.now(),saved:false,timer:{remaining:0,running:false},setupSnapshot:{mode,count,options}};
  markCurrentSeen();saveSession();ui.notice='';ui.view='play';render();
}
function resumeSession(){if(!currentSession)return;ui.view='play';ui.notice='';render()}
function saveAndExit(){saveSession();ui.modal=null;ui.view='home';render();toast('Sesja została zapisana.')}
function resetRoundState(){currentSession.phase='first';currentSession.firstAnswer=null;currentSession.secondAnswer=null;currentSession.secret=1+Math.floor(Math.random()*10);currentSession.guess=5;currentSession.clue='';currentSession.roundResult=null;currentSession.timer={remaining:0,running:false};ui.notice=''}
function markCurrentSeen(){const card=currentCard();if(card&&!profile.seen.includes(card.id)){profile.seen.push(card.id);saveProfile()}}
function nextRound(){if(!currentSession)return;currentSession.index++;if(currentSession.index>=currentSession.deck.length){ui.view='summary';saveSession();render();return}resetRoundState();markCurrentSeen();saveSession();render()}
function skipCard(){if(!currentSession)return;currentSession.results.push({cardId:currentCard().id,mode:currentCard().mode,category:currentCard().category,match:false,comparable:false,skipped:true});ui.modal=null;nextRound();toast('Karta pominięta.')}
function endSessionNow(){ui.modal=null;ui.view='summary';saveSession();render()}
function finishToHome(){currentSession=null;saveSession();goHome()}
function replaySession(){if(!currentSession)return;const snap=currentSession.setupSnapshot||{mode:currentSession.mode,count:currentSession.deck.length,options:{}};startSession(snap.mode,snap.count,snap.options)}

function acceptHandoff(){currentSession.phase='second';saveSession();render()}
function chooseFirstAnswer(index){currentSession.firstAnswer=index;currentSession.phase='handoff';saveSession();render()}
function chooseSecondAnswer(index){
  currentSession.secondAnswer=index;
  const card=currentCard();const[firstIndex,secondIndex]=roleIndexes();const same=currentSession.firstAnswer===index;let awarded=[0,0],shared=0,message='';
  if(currentSession.points){
    if(card.mode==='know'){if(same){awarded[secondIndex]=2;shared=1;message=`${currentSession.names[secondIndex]} +2 pkt, para +1 pkt wspólny.`}else message='Brak punktów. Teraz najciekawsze jest wyjaśnienie wyboru.'}
    else if(same){awarded[firstIndex]=1;awarded[secondIndex]=1;shared=1;message='Każda osoba +1 pkt, para +1 pkt wspólny.'}
    else message='Bez punktów, ale różnica zdań daje dobry temat do rozmowy.';
    currentSession.scores[0]+=awarded[0];currentSession.scores[1]+=awarded[1];currentSession.shared+=shared;
  }else message=same?'Macie zgodną odpowiedź.':'Macie różne odpowiedzi — porównajcie uzasadnienia.';
  currentSession.roundResult={match:same,awarded,shared,message};currentSession.results.push({cardId:card.id,mode:card.mode,category:card.category,match:same,comparable:true,awarded,shared});currentSession.phase='reveal';saveSession();if(same){vibrate([25,35,25]);burst()}render();
}
function submitClue(){const value=$('#clue-input')?.value.trim();if(!value){announce('Najpierw wpisz przykład lub odpowiedź.');return}currentSession.clue=value;currentSession.phase='handoff';ui.notice='';saveSession();render()}
function revealScaleAnswer(){
  const guess=+($('#guess-range')?.value||5);currentSession.secondAnswer=guess;const card=currentCard();const[,secondIndex]=roleIndexes();const diff=Math.abs(currentSession.secret-guess);const points=diff===0?3:diff===1?2:diff===2?1:0;const shared=diff===0?1:0;
  if(currentSession.points){currentSession.scores[secondIndex]+=points;currentSession.shared+=shared}
  const message=currentSession.points?(points?`${currentSession.names[secondIndex]} +${points} pkt${shared?', para +1 pkt wspólny':''}.`:'Różnica większa niż 2 — bez punktów.'):(diff===0?'Idealne trafienie.':'Porównajcie swoje skale.');
  currentSession.roundResult={match:diff===0,points,shared,message};currentSession.results.push({cardId:card.id,mode:card.mode,category:card.category,match:diff===0,comparable:true,points,shared});currentSession.phase='reveal';saveSession();if(diff===0){vibrate([25,35,25]);burst()}render();
}
function toggleFirstWord(index){const word=currentCard().words[index];currentSession.firstAnswer=toggleSelection(currentSession.firstAnswer,word,3);saveSession();render()}
function toggleSecondWord(index){const word=currentCard().words[index];currentSession.secondAnswer=toggleSelection(currentSession.secondAnswer,word,3);saveSession();render()}
function toggleSelection(current,item,max){const values=Array.isArray(current)?[...current]:[];const exists=values.indexOf(item);if(exists>=0)values.splice(exists,1);else if(values.length<max)values.push(item);return values}
function submitWords(){const clue=$('#word-clue')?.value.trim();if(!Array.isArray(currentSession.firstAnswer)||currentSession.firstAnswer.length!==3){announce('Wybierz dokładnie trzy tajne słowa.');return}if(!clue||clue.split(/\s+/).length!==1){announce('Podpowiedź powinna być jednym słowem.');return}currentSession.clue=clue;currentSession.phase='handoff';ui.notice='';saveSession();render()}
function revealWords(){
  if(!Array.isArray(currentSession.secondAnswer)||currentSession.secondAnswer.length!==3){announce('Wybierz dokładnie trzy słowa.');return}
  const card=currentCard();const[,secondIndex]=roleIndexes();const hits=currentSession.secondAnswer.filter(word=>currentSession.firstAnswer.includes(word)).length;if(currentSession.points){currentSession.scores[secondIndex]+=hits;currentSession.shared+=hits}const message=currentSession.points?`${currentSession.names[secondIndex]} +${hits} pkt, para +${hits} pkt wspólnych.`:`Trafione słowa: ${hits}/3.`;currentSession.roundResult={match:hits===3,hits,message};currentSession.results.push({cardId:card.id,mode:card.mode,category:card.category,match:hits===3,comparable:true,hits,shared:hits});currentSession.phase='reveal';ui.notice='';saveSession();if(hits===3){vibrate([25,35,25]);burst()}render();
}
function completeConversation(){const card=currentCard();if(currentSession.points)currentSession.shared++;currentSession.results.push({cardId:card.id,mode:card.mode,category:card.category,match:true,comparable:false,shared:currentSession.points?1:0});vibrate();nextRound()}
function completeChallenge(){const card=currentCard();if(currentSession.points)currentSession.shared++;currentSession.results.push({cardId:card.id,mode:card.mode,category:card.category,match:true,comparable:false,shared:currentSession.points?1:0});vibrate([25,35,25]);burst();nextRound()}

function toggleFavorite(id){const index=profile.favorites.indexOf(id);if(index>=0){profile.favorites.splice(index,1);toast('Usunięto z ulubionych.')}else{profile.favorites.push(id);toast('Zapisano w ulubionych.')}saveProfile();render()}
function hideSimilar(){const category=currentCard()?.category;if(category&&!profile.hiddenCategories.includes(category)){profile.hiddenCategories.push(category);saveProfile();toast(`Ukryto kategorię: ${CATEGORY_LABELS[category]}.`)}ui.modal=null;skipCard()}
function dailyCard(){const pool=getAllCards().filter(card=>['story','tell','challenge'].includes(card.mode));return pool[dayIndex()%pool.length]}
function markDaily(){profile.dailyDone[todayKey()]=!profile.dailyDone[todayKey()];saveProfile();render();toast(profile.dailyDone[todayKey()]?'Karta dnia ukończona.':'Cofnięto oznaczenie.')}

function setTimer(seconds){currentSession.timer={remaining:seconds,running:false};saveSession();render()}
function toggleTimer(){if(!currentSession.timer?.remaining){currentSession.timer={remaining:60,running:true}}else currentSession.timer.running=!currentSession.timer.running;saveSession();render()}
function startTimerLoop(){timerHandle=setInterval(()=>{if(!currentSession?.timer?.running)return;currentSession.timer.remaining=Math.max(0,currentSession.timer.remaining-1);const el=$('#timer-value');if(el)el.textContent=formatTimer(currentSession.timer.remaining);if(currentSession.timer.remaining===0){currentSession.timer.running=false;clearInterval(timerHandle);vibrate([100,80,100]);toast('Czas minął!');saveSession()}else if(currentSession.timer.remaining%5===0)saveSession()},1000)}
function formatTimer(seconds){const min=Math.floor((seconds||0)/60),sec=(seconds||0)%60;return`${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}

function finalizeSession(){if(!currentSession||currentSession.saved)return;const comparable=currentSession.results.filter(result=>result.comparable);const matches=comparable.filter(result=>result.match).length;const matchRate=comparable.length?Math.round(matches/comparable.length*100):0;profile.sessions.push({id:`session-${Date.now()}`,mode:currentSession.mode,finishedAt:Date.now(),startedAt:currentSession.startedAt,rounds:currentSession.results.length,scores:[...currentSession.scores],shared:currentSession.shared,matchRate,categories:currentSession.results.map(result=>result.category)});profile.sessions=profile.sessions.slice(-100);currentSession.saved=true;saveProfile();saveSession()}
function calculateStats(){const sessions=profile.sessions||[];const rounds=sessions.reduce((sum,item)=>sum+item.rounds,0);const shared=sessions.reduce((sum,item)=>sum+item.shared,0);const matchRate=sessions.length?Math.round(sessions.reduce((sum,item)=>sum+item.matchRate,0)/sessions.length):0;const favoriteMode=topValue(sessions.map(item=>item.mode))||'mix';return{sessions:sessions.length,rounds,shared,matchRate,favoriteMode}}
function topValue(values){if(!values.length)return null;const counts={};values.forEach(value=>{if(value)counts[value]=(counts[value]||0)+1});return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null}
function resetHistory(){profile.sessions=[];saveProfile();ui.modal=null;render();toast('Historia została wyczyszczona.')}
function resetSeenCards(){profile.seen=[];profile.hiddenCategories=[];saveProfile();render();toast('Wszystkie karty znów mogą się pojawić.')}
function resetAll(){Object.values(STORAGE).forEach(key=>localStorage.removeItem(key));settings={...defaultSettings,names:[...defaultSettings.names],categories:[...CATEGORIES]};profile={...defaultProfile,seen:[],favorites:[],hiddenCategories:[],custom:[],sessions:[],dailyDone:{}};currentSession=null;ui.modal=null;goHome();toast('Usunięto dane lokalne.')}
function saveSettingsForm(){settings.names=[$('#settings-name-a')?.value.trim()||'Gracz 1',$('#settings-name-b')?.value.trim()||'Gracz 2'];saveSettings();render();toast('Ustawienia zapisane.')}
function addCustomCard(){const prompt=$('#custom-prompt')?.value.trim();if(!prompt){toast('Wpisz treść karty.');return}profile.custom.push({id:`custom-${Date.now()}`,mode:'custom',type:'conversation',prompt,category:$('#custom-category').value,level:+$('#custom-level').value});saveProfile();render();toast('Dodano własną kartę.')}
function deleteCustomCard(id){profile.custom=profile.custom.filter(card=>card.id!==id);profile.favorites=profile.favorites.filter(cardId=>cardId!==id);saveProfile();render();toast('Usunięto kartę.')}

function installApp(){if(!ui.installPrompt)return;ui.installPrompt.prompt();ui.installPrompt.userChoice.finally(()=>{ui.installPrompt=null;$('#install-button').hidden=true;closeModal()})}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();ui.installPrompt=event;$('#install-button').hidden=false});
$('#install-button').addEventListener('click',installApp);
$('#menu-button').addEventListener('click',()=>{ui.modal='main-menu';renderModal()});
$('#brand-home').addEventListener('click',goHome);
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

Object.assign(window,{goHome,openGameInfo,openSetup,openMixSetup,showStats,showFavorites,showCustom,showSettings,openSessionMenu,closeModal,backdropClose,confirmEndSession,confirmResetHistory,confirmResetAll,selectPreset,setIntensity,togglePoints,startConfiguredSession,startQuick,resumeSession,saveAndExit,skipCard,endSessionNow,finishToHome,replaySession,acceptHandoff,chooseFirstAnswer,chooseSecondAnswer,submitClue,revealScaleAnswer,toggleFirstWord,toggleSecondWord,submitWords,revealWords,completeConversation,completeChallenge,nextRound,toggleFavorite,hideSimilar,markDaily,setTimer,toggleTimer,resetHistory,resetSeenCards,resetAll,saveSettingsForm,addCustomCard,deleteCustomCard,installApp});

// Stare sesje z wcześniejszej wersji nie są wznawiane, aby nie mieszać formatów danych.
if(currentSession&&currentSession.version!==2){currentSession=null;saveSession()}
render();
