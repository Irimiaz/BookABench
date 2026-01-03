import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import BaseScreen from "../../components/BaseScreen";
import useStackNavigation from "../../hooks/useStackNavigation";
import { MainStackParamList } from "../../types/navigation";
import {
  getData,
  setData,
  modifyData,
  deleteData,
} from "../../utils/apiHelpers";
import tw from "twrnc";

type Product = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  [key: string]: any;
};

export default function Products() {
  const { goBack } = useStackNavigation<MainStackParamList>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form fields
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch all products
  const fetchProducts = async () => {
    setFetching(true);
    setError("");
    try {
      const data = await getData<Product>("products", {});
      setProducts(data || []);
    } catch (error: any) {
      setError(error.message || "Failed to fetch products");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Create or Update product
  const handleSave = async () => {
    if (!productName || !productPrice) {
      setError("Please fill in name and price");
      return;
    }

    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (editingId) {
        // Update existing product
        await modifyData(
          "products",
          { _id: editingId },
          {
            name: productName,
            price: parseFloat(productPrice),
            description: productDescription,
          }
        );
        setSuccessMessage("Product updated successfully");
      } else {
        // Create new product
        await setData("products", {
          name: productName,
          price: parseFloat(productPrice),
          description: productDescription,
        });
        setSuccessMessage("Product created successfully");
      }

      // Reset form and refresh list
      setProductName("");
      setProductPrice("");
      setProductDescription("");
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      setError(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await deleteData("products", { _id: id });
      setSuccessMessage("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      setError(error.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const handleEdit = (product: Product) => {
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductDescription(product.description || "");
    setEditingId(product._id);
    setError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setProductName("");
    setProductPrice("");
    setProductDescription("");
    setEditingId(null);
    setError("");
    setSuccessMessage("");
  };

  return (
    <BaseScreen
      title="Products"
      subtitle="Manage your products"
      onBack={goBack}
    >
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-4`}>
        {/* Messages */}
        {error ? (
          <View
            style={tw`bg-red-100 border border-red-400 rounded-lg p-3 mb-4`}
          >
            <Text style={tw`text-red-700`}>{error}</Text>
          </View>
        ) : null}
        {successMessage ? (
          <View
            style={tw`bg-green-100 border border-green-400 rounded-lg p-3 mb-4`}
          >
            <Text style={tw`text-green-700`}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={tw`bg-white rounded-lg p-4 mb-4 shadow-sm`}>
          <Text style={tw`text-lg font-semibold mb-3`}>
            {editingId ? "Edit Product" : "Add New Product"}
          </Text>

          <TextInput
            style={tw`w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 mb-3`}
            placeholder="Product Name"
            value={productName}
            onChangeText={setProductName}
          />

          <TextInput
            style={tw`w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 mb-3`}
            placeholder="Price"
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={tw`w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 mb-3`}
            placeholder="Description (optional)"
            value={productDescription}
            onChangeText={setProductDescription}
            multiline
            numberOfLines={3}
          />

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={tw`flex-1 bg-blue-500 rounded-lg py-3 items-center justify-center`}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-semibold`}>
                  {editingId ? "Update" : "Create"}
                </Text>
              )}
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity
                style={tw`flex-1 bg-gray-400 rounded-lg py-3 items-center justify-center`}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={tw`text-white font-semibold`}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Products List Section */}
        <View style={tw`bg-white rounded-lg p-4 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-lg font-semibold`}>All Products</Text>
            <TouchableOpacity
              onPress={fetchProducts}
              disabled={fetching}
              style={tw`bg-blue-100 px-3 py-1 rounded`}
            >
              {fetching ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={tw`text-blue-600 font-medium`}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <Text style={tw`text-gray-500 text-center py-4`}>
              No products found. Create your first product!
            </Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={tw`bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200`}
                >
                  <View style={tw`flex-row justify-between items-start mb-2`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-lg font-semibold`}>{item.name}</Text>
                      <Text style={tw`text-blue-600 font-medium mt-1`}>
                        $
                        {typeof item.price === "number"
                          ? item.price.toFixed(2)
                          : "0.00"}
                      </Text>
                      {item.description ? (
                        <Text style={tw`text-gray-600 mt-1`}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={tw`flex-row gap-2 mt-2`}>
                    <TouchableOpacity
                      style={tw`bg-blue-500 px-4 py-2 rounded-lg flex-1`}
                      onPress={() => handleEdit(item)}
                    >
                      <Text style={tw`text-white text-center font-medium`}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`bg-red-500 px-4 py-2 rounded-lg flex-1`}
                      onPress={() => handleDelete(item._id)}
                    >
                      <Text style={tw`text-white text-center font-medium`}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </BaseScreen>
  );
}
