"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { subscriptionSchema, type SubscriptionFormData } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createSubscription } from "@/actions/subscriptions"
import { toast } from "sonner"
import { Loader2, Plus, Building2 } from "lucide-react"
import {
  SUBSCRIPTION_COMPANIES,
  type SubscriptionCompany,
} from "@/lib/subscription-companies"

const CUSTOM_NAMES_KEY = "budget-custom-subscription-names"

const builtInNames = new Set(
  SUBSCRIPTION_COMPANIES.map((c) => c.name.toLowerCase())
)

function getCustomNames(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_NAMES_KEY) || "[]")
  } catch {
    return []
  }
}

function saveCustomName(name: string) {
  const names = getCustomNames()
  if (!names.includes(name)) {
    names.push(name)
    localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(names))
  }
}

const getDefaultValues = (): SubscriptionFormData => ({
  name: "",
  amount: "",
  currency: "SAR",
  frequency: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  categoryId: undefined,
  notes: "",
  active: true,
})

interface CreateSubscriptionDialogProps {
  categories: { id: string; name: string; color: string }[]
}

function ServiceLogo({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed || !src) {
    return <Building2 className="h-4 w-4 text-muted-foreground" />
  }
  return (
    <img
      src={src}
      alt=""
      className="h-4 w-4 rounded-sm object-contain"
      onError={() => setFailed(true)}
    />
  )
}

export function CreateSubscriptionDialog({
  categories,
}: CreateSubscriptionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [serviceOpen, setServiceOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [customNames, setCustomNames] = React.useState<string[]>([])

  const form = useForm<SubscriptionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(subscriptionSchema as any),
    defaultValues: getDefaultValues(),
  })

  React.useEffect(() => {
    if (open) {
      setSearch("")
      setCustomNames(getCustomNames())
      form.reset(getDefaultValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = React.useMemo(() => {
    if (!search) return SUBSCRIPTION_COMPANIES
    const lower = search.toLowerCase()
    return SUBSCRIPTION_COMPANIES.filter((c) =>
      c.name.toLowerCase().includes(lower)
    )
  }, [search])

  const filteredCustom = React.useMemo(() => {
    const names = customNames.filter((n) => !builtInNames.has(n.toLowerCase()))
    if (!search) return names
    const lower = search.toLowerCase()
    return names.filter((n) => n.toLowerCase().includes(lower))
  }, [search, customNames])

  const showCreateOption =
    search.length > 0 &&
    !builtInNames.has(search.toLowerCase()) &&
    !customNames.some((n) => n.toLowerCase() === search.toLowerCase())

  function handleCompanySelect(company: SubscriptionCompany) {
    setServiceOpen(false)
    setSearch(company.name)
    form.setValue("name", company.name)
    form.setValue("frequency", company.defaultFrequency)
    if (company.defaultAmount) {
      form.setValue("amount", String(company.defaultAmount))
    }
    if (company.defaultCurrency) {
      form.setValue("currency", company.defaultCurrency)
    }
    const matchedCategory = categories.find(
      (cat) => cat.name === company.category
    )
    if (matchedCategory) {
      form.setValue("categoryId", matchedCategory.id)
    }
  }

  function handleCustomSelect(name: string) {
    setServiceOpen(false)
    setSearch(name)
    form.setValue("name", name)
  }

  function handleCreateCustom() {
    const name = search.trim()
    if (!name) return
    saveCustomName(name)
    setCustomNames(getCustomNames())
    setServiceOpen(false)
    form.setValue("name", name)
  }

  async function onSubmit(data: SubscriptionFormData) {
    if (!builtInNames.has(data.name.toLowerCase())) {
      saveCustomName(data.name)
    }
    setServiceOpen(false)
    setSearch("")
    setOpen(false)
    try {
      await createSubscription(data)
      toast.success("Subscription created")
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="mr-1 h-3.5 w-3.5" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>New Subscription</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 pb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Service</FormLabel>
                    <Popover
                      open={serviceOpen}
                      onOpenChange={setServiceOpen}
                      modal
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Input
                            placeholder="Search or type a name..."
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value)
                              field.onChange(e.target.value)
                              if (!serviceOpen) setServiceOpen(true)
                            }}
                            onClick={() => {
                              if (!serviceOpen) setServiceOpen(true)
                            }}
                            autoComplete="off"
                          />
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="max-h-[240px] overflow-y-auto">
                          {filtered.length === 0 &&
                            filteredCustom.length === 0 &&
                            !showCreateOption && (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                No services found.
                              </div>
                            )}

                          {showCreateOption && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                handleCreateCustom()
                              }}
                            >
                              <Plus className="h-4 w-4 text-muted-foreground" />
                              Create &ldquo;{search}&rdquo;
                            </button>
                          )}

                          {filteredCustom.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                Your services
                              </div>
                              {filteredCustom.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleCustomSelect(name)
                                  }}
                                >
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}

                          {filtered.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                Popular services
                              </div>
                              {filtered.map((company) => (
                                <button
                                  key={company.name}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleCompanySelect(company)
                                  }}
                                >
                                  <ServiceLogo src={company.logo} />
                                  <span className="flex-1">{company.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {company.category}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-[1fr_100px] gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
