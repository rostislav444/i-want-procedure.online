'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCompany } from '@/contexts/CompanyContext'
import { companyApi, uploadApi, citiesApi, Company, CitySearchResult, AddressSearchResult } from '@/lib/api'
import {
  Settings,
  Users,
  Building2,
  CreditCard,
  Phone,
  MapPin,
  Camera,
  Upload,
  Loader2,
  Save,
  ChevronRight,
  Search,
  X,
  Navigation,
} from 'lucide-react'


export default function SettingsPage() {
  const router = useRouter()
  const { companyType } = useCompany()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingCompany, setSavingCompany] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    telegram: '',
  })

  // City search state
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string; oblast: string } | null>(null)
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [citySearching, setCitySearching] = useState(false)
  const cityDropdownRef = useRef<HTMLDivElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  // Address search state
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([])
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [addressSearching, setAddressSearching] = useState(false)
  const addressDropdownRef = useRef<HTMLDivElement>(null)
  const addressDebounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadData()
  }, [companyType])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false)
      }
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    try {
      const companyResponse = await companyApi.getMyCompany()
      setCompany(companyResponse)
      setCompanyData({
        name: companyResponse.name || '',
        description: companyResponse.description || '',
        phone: companyResponse.phone || '',
        address: companyResponse.address || '',
        telegram: companyResponse.telegram || '',
      })
      if (companyResponse.city_info) {
        setSelectedCity(companyResponse.city_info)
        setCityQuery(companyResponse.city_info.name)
      }
      if (companyResponse.address) {
        setAddressQuery(companyResponse.address)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  // City search
  const handleCitySearch = useCallback(async (query: string) => {
    setCityQuery(query)
    if (query.length < 1) {
      // Show popular cities
      setCitySearching(true)
      try {
        const results = await citiesApi.search('', 10)
        setCityResults(results)
        setShowCityDropdown(true)
      } finally {
        setCitySearching(false)
      }
      return
    }
    if (query.length < 2) {
      setCityResults([])
      setShowCityDropdown(false)
      return
    }
    setCitySearching(true)
    try {
      const results = await citiesApi.search(query, 8)
      setCityResults(results)
      setShowCityDropdown(true)
    } catch (error) {
      console.error('City search error:', error)
    } finally {
      setCitySearching(false)
    }
  }, [])

  const handleCitySelect = (city: CitySearchResult) => {
    setSelectedCity({ id: city.id, name: city.name, oblast: city.oblast })
    setCityQuery(city.name)
    setShowCityDropdown(false)
    // Clear address when city changes
    setAddressQuery('')
    setCompanyData(prev => ({ ...prev, address: '' }))
  }

  const handleClearCity = () => {
    setSelectedCity(null)
    setCityQuery('')
    setCityResults([])
    setAddressQuery('')
    setCompanyData(prev => ({ ...prev, address: '' }))
  }

  // Address search with debounce
  const handleAddressSearch = useCallback((query: string) => {
    setAddressQuery(query)
    setCompanyData(prev => ({ ...prev, address: query }))

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current)
    }

    if (query.length < 3) {
      setAddressResults([])
      setShowAddressDropdown(false)
      return
    }

    addressDebounceRef.current = setTimeout(async () => {
      setAddressSearching(true)
      try {
        const cityName = selectedCity?.name || undefined
        const results = await citiesApi.searchAddress(query, cityName)
        setAddressResults(results)
        setShowAddressDropdown(results.length > 0)
      } catch (error) {
        console.error('Address search error:', error)
      } finally {
        setAddressSearching(false)
      }
    }, 500)
  }, [selectedCity])

  const handleAddressSelect = (result: AddressSearchResult) => {
    const address = result.address || result.display_name
    setAddressQuery(address)
    setCompanyData(prev => ({ ...prev, address }))
    setShowAddressDropdown(false)
  }

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCompany(true)
    try {
      await companyApi.updateCompany({
        name: companyData.name,
        description: companyData.description || undefined,
        phone: companyData.phone || undefined,
        address: companyData.address || undefined,
        city_id: selectedCity?.id || undefined,
        telegram: companyData.telegram || undefined,
      })
      showSuccess('Дані клініки збережено!')
      await loadData()
    } catch (error: any) {
      console.error('Error updating company:', error)
      showSuccess('Помилка при збереженні: ' + (error?.response?.data?.detail || error?.message || 'невідома помилка'))
    } finally {
      setSavingCompany(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showSuccess('Будь ласка, оберіть зображення')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showSuccess('Розмір файлу не повинен перевищувати 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      await companyApi.updateCompany({ logo_url: url })
      showSuccess('Логотип успішно завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading logo:', error)
      showSuccess('Помилка при завантаженні логотипу')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  if (companyType !== 'clinic') {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            </div>
    )
  }

  const botUsername = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'YOUR_BOT'
  const inviteLink = company ? `https://t.me/${botUsername}?start=${company.invite_code}` : ''

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Налаштування
          </h1>
          <p className="text-muted-foreground">
            Управління налаштуваннями клініки
          </p>
        </div>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {success}
          </span>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/team">
          <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Команда та посади</h3>
                  <p className="text-sm text-muted-foreground">
                    Управління спеціалістами
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings/payments">
          <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Налаштування оплат</h3>
                  <p className="text-sm text-muted-foreground">
                    Прийом оплати від клієнтів
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Інформація про клініку
          </CardTitle>
          <CardDescription>
            Контактні дані та опис вашої клініки
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Logo Upload Section */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b">
            <div className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {company?.logo_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${company.logo_url}`}
                    alt="Логотип клініки"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium">Логотип клініки</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Відображається на вашому сайті та в боті
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Завантаження...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Завантажити
                  </>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmitCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Назва клініки</Label>
              <Input
                id="company_name"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                value={companyData.description}
                onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                placeholder="Розкажіть про вашу клініку..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Телефон
                </Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  placeholder="+380..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram" className="flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </Label>
                <Input
                  id="telegram"
                  value={companyData.telegram}
                  onChange={(e) => setCompanyData({ ...companyData, telegram: e.target.value })}
                  placeholder="@username"
                />
              </div>
            </div>

            {/* City Selector */}
            <div className="space-y-2" ref={cityDropdownRef}>
              <Label className="flex items-center gap-1">
                <Navigation className="h-4 w-4" /> Місто
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={cityInputRef}
                  value={cityQuery}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => {
                    if (cityResults.length > 0) {
                      setShowCityDropdown(true)
                    } else {
                      handleCitySearch(cityQuery)
                    }
                  }}
                  placeholder="Почніть вводити назву міста..."
                  className="pl-9 pr-9"
                />
                {selectedCity && (
                  <button
                    type="button"
                    onClick={handleClearCity}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {citySearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {showCityDropdown && cityResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {cityResults.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm ${
                          selectedCity?.id === city.id ? 'bg-accent' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <span className="font-medium">{city.name}</span>
                          <span className="text-muted-foreground ml-1">
                            {city.oblast}
                          </span>
                        </div>
                        {city.is_regional_center && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            обл. центр
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCity && (
                <p className="text-sm text-muted-foreground">
                  {selectedCity.name}, {selectedCity.oblast}
                </p>
              )}
            </div>

            {/* Address with Autocomplete */}
            <div className="space-y-2" ref={addressDropdownRef}>
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Адреса (вулиця, будинок)
              </Label>
              <div className="relative">
                <Input
                  id="address"
                  value={addressQuery}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  onFocus={() => {
                    if (addressResults.length > 0) setShowAddressDropdown(true)
                  }}
                  placeholder={selectedCity ? `Вулиця та будинок у м. ${selectedCity.name}` : "Спочатку оберіть місто"}
                />
                {addressSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {showAddressDropdown && addressResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddressSelect(result)}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                      >
                        <div className="font-medium">
                          {result.address || result.city}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.display_name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Починайте вводити адресу — підказки з&apos;являться автоматично (OpenStreetMap)
              </p>
            </div>

            {/* Map Preview - shown only when company has saved city */}
            {company?.city_info && company.city_info.latitude && company.city_info.longitude && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Місцезнаходження на карті
                </Label>
                <div className="rounded-lg overflow-hidden border h-[250px]">
                  <iframe
                    key={`${company.city_info.id}-${company.address || ''}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={(() => {
                      const lat = company.city_info!.latitude!
                      const lon = company.city_info!.longitude!
                      const d = 0.008
                      const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`
                      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
                    })()}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {company.city_info.name}, {company.city_info.oblast}
                    {company.address ? ` — ${company.address}` : ''}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                      (company.address ? `${company.address}, ` : '') +
                      company.city_info.name + ', Україна'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Відкрити на карті
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Label className="text-muted-foreground">Код запрошення для клієнтів</Label>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-sm font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Копіювати
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={savingCompany}>
              <Save className="mr-2 h-4 w-4" />
              {savingCompany ? 'Збереження...' : 'Зберегти'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Інформація про обліковий запис</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID компанії</span>
              <span className="font-mono">{company?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug компанії</span>
              <span className="font-mono">{company?.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип</span>
              <span>{company?.type === 'clinic' ? 'Клініка' : 'ФОП'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
